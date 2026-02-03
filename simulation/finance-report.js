const config = require("./config");

class FactorySimulation {
    constructor(config) {
        this.p = config;
        this.state = {
            ...this.p.initialState(),
            totalRevenue: 0,
            totalMaterialCost: 0,
            totalOrderFees: 0,
            totalHoldingCosts: 0
        };
    }

    run() {
        this.logHistory(0, 0, 0, 0, 0, 0, 0, 0, 0);
        for (let d = 1; d <= this.p.totalDays; d++) {
            this.simulateDay(d);
        }
        console.table(this.state.history);
        this.printSummary();
    }

    simulateDay(day) {
        const s = this.state;
        const { capabilities: cap, standardLine: std, inventory: inv } = this.p;

        // 1. วัตถุดิบมาส่ง
        s.pendingInv = s.pendingInv.filter(item => {
            if (item.day === day) { s.inventory += item.qty; return false; }
            return true;
        });

        // 2. ORDER FLOW (ปรับให้ใช้ค่า orderFrequency จาก config)
        let toQ1 = s.accumulated;
        s.q1 += toQ1;
        s.accumulated = s.accepted;
        
        // ตรรกะ: ถ้าความถี่คือ 5 วัน จะเข้าวันที่ 4, 9, 14...
        // สูตร (day % frequency === frequency - 1)
        s.accepted = (day % std.orderFrequency === (std.orderFrequency - 1)) ? std.orderAmount : 0;
        s.totalAccepted += s.accepted;

        // 3. INVENTORY ORDERING
        let onWay = s.pendingInv.reduce((a, b) => a + b.qty, 0);
        let orderedToday = 0;
        let dailyOrderFee = 0;
        if ((s.inventory + onWay) <= inv.reorderPoint) {
            orderedToday = inv.reorderQty;
            dailyOrderFee = inv.orderFee;
            s.totalOrderFees += dailyOrderFee;
            s.pendingInv.push({ day: day + inv.leadTime, qty: orderedToday });
        }

        // 4. PRODUCTION: STATION 1
        let st1Cap = cap.st1Machines * cap.st1BaseCap;
        let maxByInv = Math.floor(s.inventory / std.partsPerUnit);
        let outSt1 = Math.min(s.q1, st1Cap, maxByInv);
        let dailyMaterialCost = (outSt1 * std.partsPerUnit) * inv.costPerPart;
        s.totalMaterialCost += dailyMaterialCost;
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

        // 8. DELIVERY & REVENUE
        let dailyDeliv = s.q5;
        let dailyRevenue = dailyDeliv * cap.marketPrice;
        s.deliveredTotal += dailyDeliv;
        s.totalRevenue += dailyRevenue;
        s.q5 = 0;

        // 9. HOLDING COSTS
        let totalWIP = parseFloat(s.q1) + parseFloat(s.q2) + parseFloat(s.q3) + parseFloat(s.q4) + parseFloat(s.accumulated);
        let dailyHoldingCost = (s.inventory + totalWIP) * inv.holdingCost;
        s.totalHoldingCosts += dailyHoldingCost;

        let totalDailyCost = dailyMaterialCost + dailyOrderFee + dailyHoldingCost;
        this.logHistory(day, outSt1, outInit, outManual, outFinal, dailyDeliv, orderedToday, dailyRevenue, totalDailyCost);
    }

    logHistory(day, outSt1, outInit, outManual, outFinal, dailyDeliv, orderedToday, dailyRev, dailyCost) {
        this.state.history.push({
            "Day": day,
            "Inv_Lvl": this.state.inventory.toFixed(0),
            "Ordered": orderedToday > 0 ? this.p.inventory.reorderQty.toString() : "0",
            "Accepted": this.state.accepted.toFixed(0),
            "Accum": this.state.accumulated.toFixed(0),
            "Q1": this.state.q1.toFixed(1),
            "St1 Out": outSt1.toFixed(1),
            "Q2": this.state.q2.toFixed(1),
            "Init Bat": outInit.toFixed(1),
            "Q3": this.state.q3.toFixed(1),
            "Man Out": outManual.toFixed(1),
            "Q4": this.state.q4.toFixed(1),
            "Fin Bat": outFinal.toFixed(0),
            "Deliv": dailyDeliv.toFixed(0),
            "Rev": "$" + dailyRev.toFixed(0),
            "Cost": "$" + dailyCost.toFixed(0)
        });
    }

    printSummary() {
        const s = this.state;
        const totalCost = s.totalMaterialCost + s.totalOrderFees + s.totalHoldingCosts;
        const netProfit = s.totalRevenue - totalCost;

        console.log("\n" + "=".repeat(75));
        console.log(`📊 SUMMARY REPORT (Price: $${this.p.capabilities.marketPrice})`);
        console.log("=".repeat(75));
        console.log(`💵 TOTAL REVENUE:  $${s.totalRevenue.toLocaleString()}`);
        console.log(`💸 TOTAL COST:     $${totalCost.toLocaleString()}`);
        console.log(`🏆 NET PROFIT:     $${netProfit.toLocaleString()}`);
        console.log("-".repeat(75));
        console.log(`📦 Delivered: ${s.deliveredTotal.toFixed(0)} units | Total Accepted: ${s.totalAccepted + 60} units`);
        console.log("=".repeat(75));
    }
}

const sim = new FactorySimulation(config);
sim.run();
