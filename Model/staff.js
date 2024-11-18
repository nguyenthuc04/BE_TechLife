const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Họ và tên
    email: { type: String, required: true, unique: true }, // Email của nhân viên
    phone: { type: String, required: true }, // Số điện thoại
    position: { type: String, required: true }, // Chức vụ
    department: { type: String, required: true }, // Bộ phận/phòng ban
    hireDate: { type: Date, required: true }, // Ngày tuyển dụng
    salary: { type: Number, required: true }, // Mức lương
    isActive: { type: Boolean, default: true } // Trạng thái hoạt động
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
