const express = require('express');
const router = express.Router();
const Users = require('../Model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/getListUsers', async (req, res) => {
        try {
            const users = await Users.find();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({message: 'Lỗi khi lấy dữ liệu người dùng!'});
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
        res.json({
            user,
            followingCount: user.following.length,
            followersCount: user.followers.length,
            postsCount: user.posts.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng!' });
    }
});


router.post('/createUser', async (req, res) => {
    try {
        const {account, password, birthday, name,nickname, bio, avatar, accountType} = req.body;

        if (!account || !password || !birthday || !name ||!nickname || !bio || !avatar || !accountType) {
            return res.status(400).json({message: 'Vui lòng cung cấp tất cả các trường bắt buộc!'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const users = new Users({
            account,
            password: hashedPassword,
            birthday,
            name,
            nickname,
            following: [],
            followers: [],
            bio,
            posts: [],
            avatar,
            accountType
        });

        await users.save();
        res.status(201).json({message: 'Người dùng đã được tạo thành công!', user: users});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi khi tạo người dùng!'});
    }
});

router.post('/login', async (req, res) => {
    try {
        const {account, password} = req.body;

        // Kiểm tra tài khoản
        const user = await Users.findOne({account});
        if (!user) {
            return res.status(404).json({message: 'Tài khoản không tồn tại!'});
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({message: 'Mật khẩu không đúng!'});
        }

        console.log("JWT_SECRET:", process.env.JWT_SECRET);

        // Tạo token JWT cho phiên làm việc
        const token = jwt.sign(
            {userId: user._id, account: user.account},
            "mySuperSecretKey", // Secret key lưu trong biến môi trường
            {expiresIn: '1h'}     // Token có hiệu lực trong 1 giờ
        );

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                name: user.name,
                account: user.account,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi hệ thống khi đăng nhập!'});
    }
});

router.put('/updateUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { account, password, birthday, name,nickname, bio, avatar, accountType } = req.body;

        // Find the user by ID
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng với ID cung cấp!' });
        }

        // Update user fields
        if (account) user.account = account;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (birthday) user.birthday = birthday;
        if (name) user.name = name;
        if (nickname) user.nickname = nickname;
        if (bio) user.bio = bio;
        if (avatar) user.avatar = avatar;
        if (accountType) user.accountType = accountType;

        // Save the updated user
        await user.save();
        res.json({ message: 'Người dùng đã được cập nhật thành công!', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật người dùng!' });
    }
});

router.post('/checkEmail', async (req, res) => {
    try {
        const { account } = req.body;

        // Check if email is provided
        if (!account) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email!' });
        }

        // Find the user by email
        const user = await Users.findOne({ account });
        if (user) {
            return res.status(200).json({ exists: true, message: 'Email đã tồn tại!',account });
        } else {
            return res.status(200).json({ exists: false, message: 'Email chưa được sử dụng!',account  });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra email!' });
    }
});
module.exports = router;
