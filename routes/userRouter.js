const express = require('express');
const router = express.Router();
const Users = require('../Model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const StreamChat = require('stream-chat').StreamChat;

const JWT_SECRET = process.env.JWT_SECRET;
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;
dotenv.config();
const mongoose = require('mongoose');

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


        const jwtToken = jwt.sign(
            {userId: users._id, account: users.account}, // Lưu `account` vào `userId` trong payload
            "b28qz8vgurspj533u829zef7frxvaxw623bw8vy6nhd3qj2p93gnyhqhwkwx6263", // Secret key
            { expiresIn: '1h' }  // Token có hiệu lực trong 1 giờ
        );

        const serverClient = StreamChat.getInstance("zjttkfv87qhy", "b28qz8vgurspj533u829zef7frxvaxw623bw8vy6nhd3qj2p93gnyhqhwkwx6263");
        const streamToken1 = serverClient.createToken(users._id.toString());
        console.log("Generated Stream Token:", streamToken1);

        await users.save();


        res.status(201).json({ message: 'Người dùng đã được tạo thành công!',jwtToken , user: {
                id: users._id,
                name: users.name,
                account: users.account,
                avatar: users.avatar
            }, streamToken : streamToken1 });
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
            "b28qz8vgurspj533u829zef7frxvaxw623bw8vy6nhd3qj2p93gnyhqhwkwx6263", // Secret key lưu trong biến môi trường
            {expiresIn: '1h'}     // Token có hiệu lực trong 1 giờ
        );

        // Khởi tạo Stream Chat client
        const serverClient = StreamChat.getInstance("zjttkfv87qhy", "b28qz8vgurspj533u829zef7frxvaxw623bw8vy6nhd3qj2p93gnyhqhwkwx6263");

        // Tạo token Stream Chat
        const streamToken = serverClient.createToken(user._id.toString());
        console.log("Generated Stream Token:", streamToken);
        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                name: user.name,
                account: user.account,
                avatar: user.avatar,
                password: user.password
            },
            streamToken : streamToken
        });
        console.log("id user chat = ", user._id);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi hệ thống khi đăng nhập!'});
    }
});

router.post('/login1', async (req, res) => {
    try {
        const { account, password } = req.body;

        // Tìm người dùng theo tài khoản
        const user = await Users.findOne({ account });
        if (!user) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại!' });
        }

        // So sánh trực tiếp mật khẩu băm (client) với mật khẩu băm (server)
        if (password !== user.password) {
            return res.status(401).json({ message: 'Mật khẩu không đúng!' });
        }

        // Tạo JWT token
        const token = jwt.sign(
            {userId: user._id, account: user.account},
            "b28qz8vgurspj533u829zef7frxvaxw623bw8vy6nhd3qj2p93gnyhqhwkwx6263", // Secret key lưu trong biến môi trường
            {expiresIn: '1h'}     // Token có hiệu lực trong 1 giờ
        );

        const serverClient = StreamChat.getInstance("zjttkfv87qhy", "b28qz8vgurspj533u829zef7frxvaxw623bw8vy6nhd3qj2p93gnyhqhwkwx6263");

        // Tạo token Stream Chat
        const streamToken = serverClient.createToken(user._id.toString());
        console.log("Generated Stream Token:", streamToken);
        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                name: user.name,
                account: user.account,
                avatar: user.avatar,
                password: user.password
            },
            streamToken : streamToken
        });
        console.log("id user chat = ", user._id);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập!' });
    }
});



router.put('/updateUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { account, password, birthday, name, nickname, bio, avatar, accountType } = req.body;

        // Find the user by ID
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng với ID cung cấp!' });
        }

        // Update user fields
        if (account) user.account = account;
        if (password && password !== user.password) {
            user.password = await bcrypt.hash(password, 10);
        }
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

// Route tìm kiếm người dùng theo tên
router.get('/searchUser', async (req, res) => {
    try {
        const name = req.query.name;
        // Thay thế các ký tự đặc biệt trong tên để tránh lỗi khi sử dụng trong biểu thức chính quy
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Tìm kiếm người dùng có tên khớp với biểu thức chính quy không phân biệt chữ hoa chữ thường
        const users = await Users.find({name: new RegExp(escapedName, 'i')});
        res.json(users);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

// API Theo dõi người dùng
router.post('/follow', async (req, res) => {
    const {followerId, followeeId} = req.body;

    // Kiểm tra xem followerId và followeeId có được cung cấp hay không
    if (!followerId || !followeeId) {
        return res.status(400).json({message: "followerId and followeeId are required"});
    }

    // Kiểm tra xem followerId và followeeId có phải là ObjectId hợp lệ hay không
    if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followeeId)) {
        return res.status(400).json({message: "Invalid followerId or followeeId"});
    }

    try {
        // Tìm người dùng theo followerId và followeeId
        const follower = await Users.findById(followerId);
        const followee = await Users.findById(followeeId);

        // Kiểm tra xem người dùng có tồn tại hay không
        if (!follower || !followee) {
            return res.status(404).json({message: "Người dùng không tồn tại"});
        }

        // Kiểm tra xem người dùng đã theo dõi hay chưa
        if (!followee.followers.includes(followerId)) {
            // Thêm followerId vào danh sách người theo dõi của followee
            followee.followers.push(followerId);
            // Thêm followeeId vào danh sách người đang theo dõi của follower
            follower.following.push(followeeId);
            // Lưu các thay đổi vào cơ sở dữ liệu
            await followee.save();
            await follower.save();
        }

        res.status(200).json({
            message: "Đã theo dõi người dùng",
            success: true,
            updatedUser: follower
        });
    } catch (error) {
        console.error("Error in /follow route:", error);
        res.status(500).json({message: "Lỗi hệ thống khi theo dõi người dùng", error: error.message});
    }
});

// API Bỏ theo dõi người dùng
router.post('/unfollow', async (req, res) => {
    const {followerId, followeeId} = req.body;

    try {
        // Tìm người dùng theo followerId và followeeId
        const follower = await Users.findById(followerId);
        const followee = await Users.findById(followeeId);

        // Kiểm tra xem người dùng có tồn tại hay không
        if (!follower || !followee) {
            return res.status(404).json({message: "Người dùng không tồn tại"});
        }

        // Loại bỏ followerId khỏi danh sách người theo dõi của followee
        followee.followers = followee.followers.filter(id => id.toString() !== followerId);
        // Loại bỏ followeeId khỏi danh sách người đang theo dõi của follower
        follower.following = follower.following.filter(id => id.toString() !== followeeId);

        // Cập nhật danh sách người theo dõi và người đang theo dõi trong cơ sở dữ liệu
        await Users.findByIdAndUpdate(followeeId, {followers: followee.followers}, {new: true});
        await Users.findByIdAndUpdate(followerId, {following: follower.following}, {new: true});

        res.status(200).json({
            message: "Đã bỏ theo dõi người dùng",
            success: true,
            updatedUser: follower
        });
    } catch (error) {
        console.error("Error in /unfollow route:", error);
        res.status(500).json({message: "Lỗi hệ thống khi bỏ theo dõi người dùng", error: error.message});
    }
});




module.exports = router;
