var express = require('express');
var router = express.Router();
const Users = require('../Model/user');

router.get('/getListUsers', async (req, res) => {
    try {
        const users = await Users.find();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu người dùng!' });
    }
}
);

router.get('/getUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng với ID cung cấp!' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng!' });
    }
});

router.post('/createUser', async (req, res) => {
    try {
        // Lấy thông tin users từ request body
        const { account, password, birthday, name, following, followers, bio, posts, avatar, accountType } = req.body;

        // Kiểm tra xem tất cả các trường bắt buộc có được cung cấp không
        if (!account || !password || !birthday || !name || !following || !followers || !bio || !posts || !avatar || !accountType) {
            return res.status(400).json({ message: 'Vui lòng cung cấp tất cả các trường bắt buộc!' });
        }

        const users = new Users({ account, password, birthday, name, following, followers, bio, posts, avatar, accountType });

        // Lưu người dùng vào MongoDB
        await users.save();

        // Trả về thông tin người dùng vừa tạo
        res.status(201).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo người dùng!' });
    }
});
router.put('/updateUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { id, name , email, password , image} = req.body;
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy nguoi dùng với ID cung cấp!' });
        }
        user.id = id;
        user.name = name;
        user.email = email;
        user.password = password;
        user.image = image;
        await user.save();
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật người dùng!' });
    }
});

module.exports = router;
