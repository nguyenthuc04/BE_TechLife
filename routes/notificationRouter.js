const express = require('express');
const Notification = require('../Model/notification');
const mongoose = require('mongoose');
const router = express.Router();
const moment = require('moment-timezone');

router.put('/updateNotificationRead/:notificationId', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notificationId' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.read = true;

        await notification.save();

        res.status(200).json({ success: true, message: 'Notification updated successfully', notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.put('/updateNotificationProcessed/:notificationId', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notificationId' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.processed = true;

        await notification.save();

        res.status(200).json({ success: true, message: 'Notification updated successfully', notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});
//
// router.get('/getNotifications/:yourID', async (req, res) => {
//     try {
//         const yourID = req.params.yourID;
//
//         if (!mongoose.Types.ObjectId.isValid(yourID)) {
//             return res.status(400).json({ success: false, message: 'Invalid yourID' });
//         }
//
//         const notifications = await Notification.find({ yourID }).sort({ createdAt: -1 });
//
//         res.status(200).json({ success: true,notifications: notifications });
//
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
//     }
// });
//////////////////////////
router.get('/getNotifications/:yourID', async (req, res) => {
    try {
        const yourID = req.params.yourID;
        const specificUserId = "6752b94e699f941650e95a27"; // ID người dùng cụ thể

        if (!mongoose.Types.ObjectId.isValid(yourID)) {
            return res.status(400).json({ success: false, message: 'Invalid yourID' });
        }

        const notifications = await Notification.find({
            $or: [
                { yourID: yourID }, // Điều kiện lấy thông báo của yourID
                { userId: specificUserId } // Điều kiện lấy thông báo của userID cụ thể
            ]
        }).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.post('/createGlobalNotification', async (req, res) => {
    try {
        const { contentId, imgUser, time, type, contentType } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!contentId || !imgUser || !time || !type || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: contentId, imgUser, time, type, contentType are mandatory.'
            });
        }

        // Tạo thông báo mới
        const notification = new Notification({
            contentId,
            userId: "6752b94e699f941650e95a27", // ID mặc định cho thông báo toàn cục
            imgUser,
            nameUser:"TECH LIFE", // Tên mặc định cho thông báo toàn cục
            yourID:"all", // "all" biểu thị thông báo toàn cục
            time,
            read: false,
            processed: false,
            type,
            contentType,
        });

        // Lưu thông báo vào cơ sở dữ liệu
        await notification.save();

        // Trả về phản hồi thành công
        return res.status(201).json({
            success: true,
            message: 'Global notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Error creating global notification:', error);

        // Xử lý lỗi hệ thống
        return res.status(500).json({
            success: false,
            message: 'An unexpected error has occurred. Please try again later.'
        });
    }
});




module.exports = router;
