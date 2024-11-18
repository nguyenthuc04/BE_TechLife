const express = require('express');
const router = express.Router();
const Staff = require('../Model/staff');

// Lấy danh sách nhân viên
router.get('/getListStaff', async (req, res) => {
    try {
        const staffList = await Staff.find();
        res.status(200).json(staffList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên!' });
    }
});

// Lấy thông tin nhân viên theo ID
router.get('/getStaff/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên với ID cung cấp!' });
        }
        res.status(200).json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin nhân viên!' });
    }
});

// Tạo mới nhân viên
router.post('/createStaff', async (req, res) => {
    try {
        const { name, email, phone, position, department, hireDate, salary, isActive } = req.body;

        if (!name || !email || !phone || !position || !department || !hireDate || salary == null) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin nhân viên!' });
        }

        const newStaff = new Staff({ name, email, phone, position, department, hireDate, salary, isActive });
        await newStaff.save();

        res.status(201).json({ message: 'Nhân viên đã được tạo thành công!', staff: newStaff });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo nhân viên!' });
    }
});

// Cập nhật thông tin nhân viên
router.put('/updateStaff/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const { name, email, phone, position, department, hireDate, salary, isActive } = req.body;

        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên với ID cung cấp!' });
        }

        if (name) staff.name = name;
        if (email) staff.email = email;
        if (phone) staff.phone = phone;
        if (position) staff.position = position;
        if (department) staff.department = department;
        if (hireDate) staff.hireDate = hireDate;
        if (salary != null) staff.salary = salary;
        if (isActive != null) staff.isActive = isActive;

        await staff.save();

        res.status(200).json({ message: 'Nhân viên đã được cập nhật thành công!', staff });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật nhân viên!' });
    }
});

// Xóa nhân viên
router.delete('/deleteStaff/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const staff = await Staff.findByIdAndDelete(staffId);
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên với ID cung cấp!' });
        }
        res.status(200).json({ message: 'Nhân viên đã được xóa thành công!', staff });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa nhân viên!' });
    }
});

// Tìm kiếm nhân viên theo tên
router.get('/searchStaff', async (req, res) => {
    try {
        const name = req.query.name;
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const staffList = await Staff.find({ name: new RegExp(escapedName, 'i') });
        res.status(200).json(staffList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tìm kiếm nhân viên!' });
    }
});

module.exports = router;
