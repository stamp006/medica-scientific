const config = require("./config");
class FactorySimulation {
    constructor(config) {
        this.p = config;
        this.state = this.p.initialState();
    }

    run() {
        // บันทึก Day 0 (ไม่มีการสั่งของในวันเริ่มต้น)
        this.logHistory(0, 0, 0, 0, 0, 0, 0);

        for (let d = 1; d <= this.p.totalDays; d++) {
            this.simulateDay(d);
        }

        console.table(this.state.history);
        this.printSummary(); // เรียกฟังก์ชันสรุปผลเมื่อรันเสร็จ
        return this.state.history;
    }

    simulateDay(day) {
        const s = this.state;
        const cap = this.p.capabilities;
        const std = this.p.standardLine;
        const inv = this.p.inventory;

        // 1. ตรวจสอบของที่มาส่งวันนี้
        s.pendingInv = s.pendingInv.filter(item => {
            if (item.day === day) { s.inventory += item.qty; return false; }
            return true;
        });

        // 2. ORDER FLOW
        let toQ1 = s.accumulated;
        s.q1 += toQ1;
        s.accumulated = s.accepted;
        s.accepted = (day % std.orderFrequency === (std.orderFrequency - 1)) ? std.orderAmount : 0;
        s.totalAccepted += s.accepted;

        // 3. INVENTORY ORDERING LOGIC (เพิ่มการเก็บค่าเพื่อแสดงในตาราง)
        let onWay = s.pendingInv.reduce((a, b) => a + b.qty, 0);
        let orderedToday = 0; // ตัวแปรสำหรับเก็บยอดสั่งซื้อของวันนี้

        if ((s.inventory + onWay) <= inv.reorderPoint) {
            orderedToday = inv.reorderQty;
            s.pendingInv.push({ 
                day: day + inv.leadTime, 
                qty: orderedToday 
            });
        }

        // 4. PRODUCTION: STATION 1
        let st1Cap = cap.st1Machines * cap.st1BaseCap;
        let maxByInv = Math.floor(s.inventory / std.partsPerUnit);
        let outSt1 = Math.min(s.q1, st1Cap, maxByInv);
        s.q1 -= outSt1;
        s.inventory -= (outSt1 * std.partsPerUnit);
        s.q2 += outSt1;

        // 5. BATCHING: INITIAL
        let outInit = (day % std.initialBatchInterval === 0) ? Math.min(s.q2, std.initialBatchMax) : 0;
        s.q2 -= outInit; s.q3 += outInit;

        // 6. PRODUCTION: MANUAL
        let outManual = Math.min(s.q3, cap.manualBaseCap);
        s.q3 -= outManual; s.q4 += outManual;

        // 7. BATCHING: FINAL
        let outFinal = (s.q4 >= std.finalBatchSize) ? std.finalBatchSize : 0;
        s.q4 -= outFinal; s.q5 += outFinal;

        // 8. DELIVERY
        let dailyDeliv = s.q5;
        s.deliveredTotal += dailyDeliv;
        s.q5 = 0;

        // บันทึกข้อมูลพร้อมยอดสั่งซื้อ
        this.logHistory(day, outSt1, outInit, outManual, outFinal, dailyDeliv, orderedToday);
    }

    logHistory(day, outSt1, outInit, outManual, outFinal, dailyDeliv, orderedToday) {
        this.state.history.push({
            "Inv_Level": this.state.inventory.toFixed(2),
            "Ordered (Qty)": orderedToday.toFixed(0),
            "Day": day,
            "Accepted": this.state.accepted.toFixed(0),
            "Accumulated": this.state.accumulated.toFixed(0),
            "Queue 1": this.state.q1.toFixed(2),
            "St1 Out": outSt1.toFixed(2),
            "Queue 2": this.state.q2.toFixed(2),
            "Init Batch": outInit.toFixed(2),
            "Queue 3": this.state.q3.toFixed(2),
            "Manual Out": outManual.toFixed(2),
            "Queue 4": this.state.q4.toFixed(2),
            "Final Batch": outFinal.toFixed(2),
            "Deliveries": dailyDeliv.toFixed(2),
        });
    }

    printSummary() {
        const s = this.state;
        const totalWIP = parseFloat(s.q1) + parseFloat(s.q2) + parseFloat(s.q3) + parseFloat(s.q4) + parseFloat(s.q5) + parseFloat(s.accumulated);
        const serviceLevel = (s.deliveredTotal / (s.totalAccepted + 60)) * 100; // +60 จากออเดอร์ตั้งต้น

        console.log("\n" + "=".repeat(50));
        console.log("🎯 สรุปผลการดำเนินงาน (Simulation Summary - Day 50)");
        console.log("=".repeat(50));
        console.log(`📦 ยอดส่งมอบสะสมทั้งหมด:      ${s.deliveredTotal.toFixed(2)} หน่วย`);
        console.log(`📈 ออเดอร์ที่ได้รับทั้งหมด:      ${(s.totalAccepted + 60).toFixed(2)} หน่วย`);
        console.log(`✅ Service Level:          ${serviceLevel.toFixed(2)} %`);
        console.log("-".repeat(50));
        console.log(`🏭 งานค้างในระบบรวม (WIP):    ${totalWIP.toFixed(2)} หน่วย`);
        console.log(`  └─ ค้างมากที่สุดที่:          ${s.q3 > s.q1 ? "Queue 3 (หน้างาน Manual)" : "Queue 1 (หน้าเครื่องจักร)"}`);
        console.log("-".repeat(50));
        console.log(`🔩 วัตถุดิบเหลือในคลัง:          ${s.inventory.toFixed(2)} ชิ้น`);
        console.log(`🚚 ของที่กำลังเดินทางมา:        ${s.pendingInv.reduce((a, b) => a + b.qty, 0)} ชิ้น`);
        console.log("=".repeat(50));
        
        if (serviceLevel < 50) {
            console.log("⚠️ ข้อแนะนำ: ระบบมีคอขวดรุนแรง! ควรเพิ่มกำลังผลิตที่จุด Manual หรือเพิ่มเครื่องจักร");
        } else {
            console.log("✅ สถานะ: โรงงานทำงานได้ค่อนข้างสมดุล");
        }
    }
}

const sim = new FactorySimulation(config);
sim.run();
