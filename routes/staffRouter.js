const express = require('express');
const router = express.Router();
const Staff = require('../Model/staff');

// Lấy danh sách nhân viên
router.get('/getListStaff', async (req, res) => {
    try {
        const staffList = await Staff.find();
        res.status(200).json(staffList);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên!' });
    }
});

// Lấy thông tin nhân viên theo ID
router.get('/getStaff/:id', async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên!' });
        }
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin nhân viên!' });
    }
});

// Tạo mới nhân viên
router.post('/createStaff', async (req, res) => {
    const { name, email, phone, position, department, hireDate, salary, isActive } = req.body;

    if (!name || !email || !phone || !position || !department || !hireDate || salary == null) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin nhân viên!' });
    }

    try {
        const newStaff = new Staff({ name, email, phone, position, department, hireDate, salary, isActive });
        await newStaff.save();
        res.status(201).json({ message: 'Nhân viên đã được tạo thành công!', staff: newStaff });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo nhân viên!' });
    }
});

// Cập nhật thông tin nhân viên
router.put('/updateStaff/:id', async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên!' });
        }

        // Cập nhật các trường có trong body
        Object.keys(req.body).forEach(key => {
            if (req.body[key] != null) {
                staff[key] = req.body[key];
            }
        });

        await staff.save();
        res.status(200).json({ message: 'Nhân viên đã được cập nhật thành công!', staff });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật nhân viên!' });
    }
});

// Xóa nhân viên
router.delete('/deleteStaff/:id', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên!' });
        }
        res.status(200).json({ message: 'Nhân viên đã được xóa thành công!', staff });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa nhân viên!' });
    }
});

// Tìm kiếm nhân viên theo tên
router.get('/searchStaff', async (req, res) => {
    try {
        const name = req.query.name;
        if (!name) {
            return res.status(400).json({ message: 'Vui lòng cung cấp tên để tìm kiếm!' });
        }

        const staffList = await Staff.find({ name: new RegExp(name, 'i') });
        res.status(200).json(staffList);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tìm kiếm nhân viên!' });
    }
});

module.exports = router;
