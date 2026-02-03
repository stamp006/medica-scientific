// Shared configuration for simulations
const config = {
    totalDays: 50,
    inventory: {
        leadTime: 4, // เวลาสั่งของทุก 4 วัน
        reorderPoint: 120, // จุดสั่งซื้อเมื่อสินค้าน้อยกว่าจำนวน
        reorderQty: 200, // จำนวนสั่งซื้อ
        costPerPart: 45, // ค่าใช้จ่ายต่อชิ้น
        orderFee: 1500, // ค่าสั่งของ   
        holdingCost: 1 // ค่าถือสินค้า
    },
    standardLine: {
        partsPerUnit: 2, // จำนวนชิ้น ที่ใช้ต่อการผลิต
        orderAmount: 60, // จำนวนสั่งผลิต
        orderFrequency: 5, // จำนวนรอบวันที่สั่งผลิตทุกกี่วัน
        initialBatchInterval: 4, // รอบวันที่ส่ง Batch interval
        initialBatchMax: 60, // จำนวนชิ้นใน Batch
        finalBatchSize: 12 // จำนวนชิ้นใน batch final 
    },
    capabilities: {
        st1BaseCap: 4.67, // กำลังการผลิตต่อเครื่อง
        st1Machines: 2, // จำนวนเครื่อง
        manualBaseCap: 2.71, // กำลังการผลิตของแรงงานคน จากตัวอย่างคือ 1 คน
        marketPrice: 190 // ราคาขาย ใช้คำนวณต้นทุนและกำไร
    }
};

config.initialState = () => ({
    day: 0,             // วันเริ่มต้นของการจำลอง (Baseline)
    accepted: 0,        // ออเดอร์ใหม่ที่เพิ่งกดรับในวันนั้น (New Sales)
    accumulated: 60,    // ออเดอร์ที่ยืนยันแล้ว รอคิวเข้าสู่กระบวนการผลิตในวันถัดไป (Backlog)
    q1: 0,              // Queue 1: จำนวนงานที่ค้างอยู่หน้าเครื่องจักร Station 1
    q2: 60,             // Queue 2: งานที่ออกจากเครื่องจักรแล้ว รอการขนย้าย (Initial Batching)
    q3: 22.27,          // Queue 3: งานที่ขนย้ายมาแล้ว รอพนักงานเริ่มทำ (Manual Processing)
    q4: 12,             // Queue 4: งานที่พนักงานทำเสร็จแล้ว รอการบรรจุ/ตรวจสอบรอบสุดท้าย (Final Batching)
    q5: 0,              // Queue 5: สินค้าสำเร็จรูปที่รอการส่งมอบออกจากโรงงาน (Shipping Dock)
    inventory: 108,     // จำนวนวัตถุดิบ (Raw Materials) ที่มีพร้อมใช้ในคลังสินค้า
    pendingInv: [],     // รายการวัตถุดิบที่สั่งซื้อไปแล้ว แต่ยังอยู่ระหว่างเดินทาง (Lead Time Tracking)
    deliveredTotal: 0,  // ยอดรวมสินค้าที่ส่งมอบสำเร็จสะสมตั้งแต่เริ่มรัน
    totalAccepted: 0,   // ยอดรวมคำสั่งซื้อที่รับเข้ามาทั้งหมดสะสมตั้งแต่เริ่มรัน
    history: []         // อาเรย์สำหรับเก็บ Log ข้อมูลรายวันเพื่อนำไปแสดงในตาราง (Daily Report)
});

module.exports = config;
