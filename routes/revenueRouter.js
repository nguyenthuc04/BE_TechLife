const express = require('express');
const Revenue = require('../Model/revenue');
const router = express.Router();

router.post('/createRevenue', async (req, res) => {
    try {
        const { idUser, type, price, date, idStaff } = req.body;

        if (!idUser || !type || !price || !idStaff) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const newRevenue = new Revenue({
            idUser,
            type,
            price,
            date : new Date().toISOString(),
            idStaff
        });

        await newRevenue.save();
        res.status(201).json({ success: true, message: 'revenue created successfully', revenue: newRevenue });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

function getDateRange(filterType, customStartDate, customEndDate) {
    const now = new Date();
    let startDate, endDate;

    switch (filterType) {
        case "day": // Trong ngày
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            break;

        case "week": // Trong tuần (thứ Hai đến Chủ Nhật)
            const weekDay = now.getDay(); // Lấy thứ trong tuần
            const mondayOffset = weekDay === 0 ? -6 : 1 - weekDay; // Tìm thứ Hai đầu tuần

            startDate = new Date(now);
            startDate.setDate(now.getDate() + mondayOffset); // Xác định thứ Hai
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); // Chủ Nhật
            endDate.setHours(23, 59, 59, 999);
            break;

        case "month": // Trong tháng
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;

        case "custom": // Tuỳ chỉnh
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;

        default:
            throw new Error("Invalid filter type");
    }

    // Điều chỉnh múi giờ về Việt Nam (UTC+7)
    startDate = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
    endDate = new Date(endDate.getTime() + 7 * 60 * 60 * 1000);

    return { startDate, endDate };
}


router.get("/getRevenueByDate", async (req, res) => {
    const { filterType, startDate, endDate, idUser, idStaff, type } = req.query;

    try {
        // Xác định khoảng thời gian
        if (!filterType || (filterType === "custom" && (!startDate || !endDate))) {
            return res.status(400).json({ success: false, message: "Invalid parameters" });
        }
        const { startDate: start, endDate: end } = getDateRange(filterType, startDate, endDate);

        // Tạo query với các điều kiện
        const query = {
            date: { $gte: start, $lte: end },
        };


        // Truy vấn doanh thu từ MongoDB
        const revenues = await Revenue.find(query);

        // Tạo danh sách tất cả các ngày trong khoảng thời gian
        const allDates = [];
        let currentDate = new Date(start);
        while (currentDate <= end) {
            allDates.push(new Date(currentDate).toISOString().split("T")[0]); // Định dạng YYYY-MM-DD
            currentDate.setDate(currentDate.getDate() + 1); // Tăng ngày lên 1
        }

        // Gom nhóm doanh thu theo ngày
        const groupedRevenues = revenues.reduce((acc, revenue) => {
            const dateKey = new Date(revenue.date).toISOString().split("T")[0];
            if (!acc[dateKey]) {
                acc[dateKey] = { revenues: [], total: 0 };
            }
            acc[dateKey].revenues.push(revenue);
            acc[dateKey].total += parseFloat(revenue.price);
            return acc;
        }, {});

        // Kết hợp dữ liệu với danh sách tất cả các ngày
        const result = allDates.map(date => {
            const dayData = groupedRevenues[date] || { revenues: [], total: 0 };
            return {
                date: date,
                revenues: dayData.revenues,
                total: dayData.total,
            };
        });

        // Trả về kết quả
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.error("Error fetching revenues:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/getRevenueByDateAndType", async (req, res) => {
    const { filterType, startDate, endDate, idUser, idStaff, type } = req.query;

    try {
        // Xác định khoảng thời gian
        if (!filterType || (filterType === "custom" && (!startDate || !endDate))) {
            return res.status(400).json({ success: false, message: "Invalid parameters" });
        }
        const { startDate: start, endDate: end } = getDateRange(filterType, startDate, endDate);

        // Tạo query với các điều kiện
        const query = {
            date: { $gte: start, $lte: end },
        };

        // Nếu có idUser hoặc idStaff, có thể thêm vào query
        if (idUser) query.idUser = idUser;
        if (idStaff) query.idStaff = idStaff;
        if (type) query.type = type;  // Nếu cần lọc theo loại "type"

        // Truy vấn doanh thu từ MongoDB
        const revenues = await Revenue.find(query);

        // Tạo danh sách tất cả các ngày trong khoảng thời gian
        const allDates = [];
        let currentDate = new Date(start);
        while (currentDate <= end) {
            allDates.push(new Date(currentDate).toISOString().split("T")[0]); // Định dạng YYYY-MM-DD
            currentDate.setDate(currentDate.getDate() + 1); // Tăng ngày lên 1
        }

        // Gom nhóm doanh thu theo ngày và tính tổng cho từng ngày
        const groupedRevenues = revenues.reduce((acc, revenue) => {
            const dateKey = new Date(revenue.date).toISOString().split("T")[0];
            if (!acc[dateKey]) {
                acc[dateKey] = { revenues: [], total: 0 };
            }
            acc[dateKey].revenues.push(revenue);
            acc[dateKey].total += parseFloat(revenue.price); // Cộng dồn doanh thu
            return acc;
        }, {});

        // Kết hợp dữ liệu với danh sách tất cả các ngày
        const result = allDates.map(date => {
            const dayData = groupedRevenues[date] || { revenues: [], total: 0 };
            return {
                date: date,
                revenues: dayData.revenues,
                total: dayData.total,  // Tổng doanh thu cho từng ngày
            };
        });

        // Tính tổng doanh thu cho toàn bộ khoảng thời gian (dùng cho filterType là "week", "month", v.v.)
        const totalRevenue = result.reduce((sum, dayData) => sum + dayData.total, 0);

        // Trả về kết quả bao gồm tổng doanh thu cho cả khoảng thời gian
        res.status(200).json({ success: true, data: result, totalRevenue: totalRevenue });
    } catch (err) {
        console.error("Error fetching revenues:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});





module.exports = router;
