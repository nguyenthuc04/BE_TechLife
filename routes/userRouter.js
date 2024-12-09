const express = require('express');
const router = express.Router();
const Users = require('../Model/user');
const UserPremium = require('../Model/userPremium');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const StreamChat = require('stream-chat').StreamChat;
const Premium = require('../Model/premium');
const JWT_SECRET = process.env.JWT_SECRET;
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;
dotenv.config();
const mongoose = require('mongoose');
const Staff = require("../Model/staff");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const moment = require('moment-timezone');
const Review = require('../Model/review');


router.put('/updateAccountType/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user by userId
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Find the user's premium information
        const userPremium = await UserPremium.findOne({ userId });
        if (!userPremium) {
            return res.status(404).json({ success: false, message: 'UserPremium not found' });
        }

        // Check if the endDate has expired
        const currentDate = moment();
        const endDate = moment(userPremium.endDate);
        console.log('currentDate:', currentDate.format());
        console.log('userPremium.endDate:', endDate.format());
        if (endDate.isBefore(currentDate)) {
            // Update the accountType to 'mentee' if the premium has expired
            user.accountType = 'mentee';
            await user.save();
            return res.status(200).json({ success: true, message: 'Account type updated to mentee due to expired premium' });
        }
    } catch (error) {
        console.error('Error updating account type:', error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.post('/createReview', async (req, res) => {
    try {
        const {idMentor, rating, comment, userId} = req.body;

        if (!idMentor || !rating || !comment || !userId) {
            return res.status(400).json({success: false, message: 'All fields are required'});
        }
        const vietnamTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        const newReview = new Review({
            idMentor,
            rating,
            comment,
            userId,
            date: vietnamTime
        });

        await newReview.save();
        res.status(201).json({success: true, message: 'Review created successfully'});
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});

router.get('/averageRating/:idMentor', async (req, res) => {
    try {
        const idMentor = req.params.idMentor;

        const reviews = await Review.find({idMentor});
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({success: false, message: 'No reviews found for this mentor'});
        }

        const totalRating = reviews.reduce((sum, review) => sum + parseFloat(review.rating), 0);
        const averageRating = Math.round(totalRating / reviews.length);
        res.status(200).json({success: true, averageRating: averageRating});
    } catch (error) {
        console.error('Error calculating average rating:', error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});

router.get('/getReview/:idMentor', async (req, res) => {
    try {
        const idMentor = req.params.idMentor;

        const reviews = await Review.find({idMentor}).populate('userId', 'name avatar');
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({success: false, message: 'Reviews not found'});
        }

        res.status(200).json({success: true, reviews: reviews});
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const AcceptedReview = require('../Model/AcceptedReview');
// API chấp nhận đánh giá
router.put('/reviewsQT/:id/accept', async (req, res) => {
    try {
        const reviewId = req.params.id;
        // Kiểm tra xem reviewId có hợp lệ không
        if (!reviewId) {
            return res.status(400).json({error: 'ID đánh giá không hợp lệ'});
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({error: 'Không tìm thấy đánh giá'});
        }

        // Kiểm tra xem đánh giá đã được chấp nhận chưa
        const existingAcceptedReview = await AcceptedReview.findOne({reviewId});
        if (existingAcceptedReview) {
            return res.status(400).json({error: 'Khoá học đã được chấp nhận trước đó'});
        }

        // Tạo một bản ghi mới trong collection AcceptedReview
        const acceptedReview = new AcceptedReview({reviewId});
        await acceptedReview.save();

        // Trả về thông báo thành công cùng với thông tin bản ghi đã tạo
        res.status(200).json({message: 'Chấp nhận đánh giá thành công', acceptedReview});
    } catch (error) {
        console.error('Lỗi khi chấp nhận đánh giá:', error);
        res.status(500).json({error: 'Lỗi khi chấp nhận đánh giá'});
    }
});


// Cập nhật API lấy danh sách đánh giá để chỉ trả về các đánh giá chưa được chấp nhận
router.get('/reviewsQT', async (req, res) => {
    try {
        const acceptedReviewIds = await AcceptedReview.find().distinct('reviewId');
        const reviews = await Review.find({_id: {$nin: acceptedReviewIds}});

        const processedReviews = reviews.map(review => {
            if (Array.isArray(review.imageUrl) && review.imageUrl.length > 0) {
                review.imageUrl = review.imageUrl.map(url => url);
            } else {
                review.imageUrl = [];
            }
            return review;
        });

        res.status(200).json(processedReviews);
    } catch (error) {
        res.status(500).json({error: 'Lỗi khi lấy danh sách đánh giá'});
    }
});

router.get('/reviewsQT/accepted', async (req, res) => {
    try {
        const acceptedReviews = await AcceptedReview.find().populate('reviewId');

        // Ghi log để kiểm tra dữ liệu
        console.log('Danh sách các đánh giá đã chấp nhận:', acceptedReviews);

        const processedReviews = acceptedReviews.map(acceptedReview => {
            const review = acceptedReview.reviewId;

            if (!review) {
                console.error(`Không tìm thấy đánh giá cho acceptedReview ID: ${acceptedReview._id}`);
                return null; // Hoặc xử lý theo cách khác nếu cần
            }

            return {
                ...review.toObject(),
                acceptedAt: acceptedReview.acceptedAt
            };
        }).filter(review => review !== null);

        res.status(200).json(processedReviews);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đánh giá đã chấp nhận:', error);
        res.status(500).json({error: 'Lỗi khi lấy danh sách đánh giá đã chấp nhận'});
    }
});

router.put('/reviewsQT/:id/unarchive', async (req, res) => {
    try {
        const reviewId = req.params.id;

        // Xóa đánh giá khỏi danh sách đã chấp nhận
        await AcceptedReview.findOneAndDelete({reviewId: reviewId});

        // Lấy thông tin đánh giá
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({success: false, message: 'Không tìm thấy đánh giá'});
        }

        res.status(200).json({success: true, message: 'Đánh giá đã được hủy lưu trữ', review: review});
    } catch (error) {
        console.error('Lỗi khi hủy lưu trữ đánh giá:', error);
        res.status(500).json({success: false, error: 'Lỗi khi hủy lưu trữ đánh giá'});
    }
});

// API xóa đánh giá
router.delete('/reviewsQT/:id', async (req, res) => {
    try {
        const reviewId = req.params.id;
        const deletedReview = await Review.findByIdAndDelete(reviewId);
        if (!deletedReview) {
            return res.status(404).json({error: 'Không tìm thấy đánh giá'});
        }
        res.status(200).json({message: 'Xóa đánh giá thành công'});
    } catch (error) {
        res.status(500).json({error: 'Lỗi khi xóa đánh giá'});
    }
});
/////////////////////////////////

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: "tretrauzxx@gmail.com",
        pass: "knhe erqn wugp seuh"
    }
});

router.post('/sendEmail', async (req, res) => {
    try {
        const {email} = req.body;

        // Find the user by email
        const user = await Users.findOne({account: email});
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        // Generate a 6-digit code
        const resetCode = crypto.randomInt(100000, 999999).toString();

        // Save the reset code to the user's document
        user.resetCode = resetCode;
        user.resetCodeExpiration = Date.now() + 3600000; // Code valid for 1 hour
        await user.save();

        // Send the email
        const mailOptions = {
            from: "tretrauzxx@gmail.com",
            to: email,
            subject: 'OTP Code',
            text: `Your password reset code is ${resetCode}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({message: 'Reset code sent to email', code: resetCode});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'An error occurred while sending the reset code'});
    }
});

router.post('/resetPassword', async (req, res) => {
    try {
        const {account, newPassword} = req.body;

        // Find the user by account
        const user = await Users.findOne({account});
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        // Hash the new password and save it
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({success: true, message: 'Password reset successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'An error occurred while resetting the password'});
    }
});


router.post('/createPremium', async (req, res) => {
    try {
        const {userId, userName, userImageUrl, imageUrl} = req.body;

        if (!userId || !userName || !userImageUrl || !imageUrl) {
            return res.status(400).json({success: false, message: 'All fields are required'});
        }
        const vietnamTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        const newPremium = new Premium({
            userId,
            userName,
            userImageUrl,
            imageUrl,
            startDate: vietnamTime
        });

        await newPremium.save();
        res.status(201).json({success: true, message: 'Premium entry created successfully', premium: newPremium});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});


router.get('/getUserPremium/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Tìm thông tin UserPremium theo userId
        const userPremium = await UserPremium.findOne({ userId });

        if (userPremium) {
            return res.status(200).json({
                success: true,
                message: 'UserPremium được tìm thấy',
                data: userPremium,
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin UserPremium',
            });
        }
    } catch (error) {
        console.error('Lỗi khi gọi GET /getUserPremium/:userId', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi trong quá trình tìm UserPremium',
        });
    }
});

router.post('/approveMentor/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Tìm thông tin yêu cầu Premium
        const premiumRequest = await Premium.findById(id);
        if (!premiumRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu mentor'
            });
        }

        // Tìm thông tin user liên quan
        const user = await Users.findById(premiumRequest.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng liên quan'
            });
        }

        // Kiểm tra và xử lý logic chuyển đổi trạng thái tài khoản
        if (user.accountType === 'mentor') {
            return res.status(200).json({
                success: true,
                message: 'Người dùng đã là mentor.'
            });
        } else if (user.accountType !== 'mentee') {
            return res.status(400).json({
                success: false,
                message: 'Người dùng không thể chuyển thành mentor.'
            });
        }

        // Cập nhật tài khoản người dùng thành mentor
        user.accountType = 'mentor';
        await user.save();

        // Xóa yêu cầu Premium
        await Premium.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Người dùng đã được chuyển thành mentor và yêu cầu đã xóa.',
            data: { user }
        });
    } catch (error) {
        console.error('Lỗi khi duyệt mentor:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xảy ra khi duyệt mentor'
        });
    }
});
router.post('/updateUserPremium', async (req, res) => {
    const { userId, userName } = req.body;

    if (!userId || !userName) {
        return res.status(400).json({
            success: false,
            message: 'userId và userName là bắt buộc',
        });
    }

    try {
        let userPremium = await UserPremium.findOne({ userId });

        if (userPremium) {
            userPremium.endDate = moment(userPremium.endDate).add(30, 'days').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            await userPremium.save();
        } else {
            const startDate = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            const endDate = moment(startDate).add(30, 'days').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

            userPremium = new UserPremium({ userId, userName, startDate, endDate });
            await userPremium.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Thông tin UserPremium đã được cập nhật hoặc tạo mới.',
            data: userPremium,
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật UserPremium:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xảy ra khi cập nhật UserPremium',
        });
    }
});




router.get('/getPremiumRequests', async (req, res) => {
    try {
        const premiumRequests = await Premium.find();
        return res.status(200).json({
            success: true,
            data: premiumRequests, // Trả về mảng rỗng nếu không có tài liệu
        });
    } catch (error) {
        console.error('Lỗi khi lấy yêu cầu premium:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy yêu cầu'
        });
    }
});
router.get('/getPremiumRequest/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const premiumRequest = await Premium.findById(id);

        if (!premiumRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu',
            });
        }

        return res.status(200).json({
            success: true,
            data: premiumRequest,
        });
    } catch (error) {
        console.error('Lỗi khi lấy yêu cầu Premium:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xảy ra khi lấy yêu cầu Premium.',
        });
    }
});



// Xóa yêu cầu Premium
router.delete('/deletePremiumRequest/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const result = await Premium.findByIdAndDelete(id);

        if (!result) {
            return res.status(200).json({  // Không trả lỗi nếu không tìm thấy
                success: true,
                message: 'Yêu cầu không tồn tại, nhưng đã xử lý thành công'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Yêu cầu đã được xóa thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa yêu cầu:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa yêu cầu'
        });
    }
});


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

router.get('/getListUsersByAccountType', async (req, res) => {
    try {
        // Lấy giá trị 'accountType' từ query parameters
        const {accountType} = req.query; // Ví dụ: /getListUsers?accountType=admin

        // Kiểm tra nếu có accountType được truyền vào
        let query = {};
        if (accountType) {
            query.accountType = accountType; // Thêm điều kiện accountType vào query nếu có
        }

        // Truy vấn người dùng từ database với điều kiện nếu có
        const users = await Users.find(query);  // Sử dụng query với điều kiện nếu có accountType
        const count = await Users.countDocuments(query);
        res.json({users, count});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi khi lấy dữ liệu người dùng!'});
    }
});


router.get('/getUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'Không tìm thấy người dùng với ID cung cấp!'});
        }
        res.json({
            user,
            followingCount: user.following.length,
            followersCount: user.followers.length,
            postsCount: user.posts.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi khi lấy thông tin người dùng!'});
    }
});


router.post('/createUser', async (req, res) => {
    try {
        const {account, password, birthday, name, nickname, bio, avatar, accountType} = req.body;

        if (!account || !password || !birthday || !name || !nickname || !bio || !avatar || !accountType) {
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
            {expiresIn: '1h'}  // Token có hiệu lực trong 1 giờ
        );

        const serverClient = StreamChat.getInstance("zjttkfv87qhy", "b28qz8vgurspj533u829zef7frxvaxw623bw8vy6nhd3qj2p93gnyhqhwkwx6263");
        const streamToken1 = serverClient.createToken(users._id.toString());
        console.log("Generated Stream Token:", streamToken1);

        await users.save();


        res.status(201).json({
            message: 'Người dùng đã được tạo thành công!', jwtToken, user: {
                id: users._id,
                name: users.name,
                account: users.account,
                avatar: users.avatar
            }, streamToken: streamToken1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi khi tạo người dùng!'});
    }
});

router.post('/changepassword', async (req, res) => {
    try {
        const {account, oldPassword, newPassword} = req.body;

        // Find the user by account
        const user = await Users.findOne({account});
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        // Verify the old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({message: 'Incorrect old password'});
        }

        // Hash the new password and save it
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({success: true});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'An error occurred while changing the password!'});
    }
});

router.put('/updateLastLogin/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({success: false, message: 'Invalid userId'});
        }

        const vietnamTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            {lastLog: vietnamTime},
            {new: true, runValidators: true}
        );

        if (!updatedUser) {
            return res.status(404).json({success: false, message: 'User not found'});
        }

        res.status(200).json({success: true, message: 'User last login time updated successfully', user: updatedUser});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});

router.post('/login', async (req, res) => {
    try {
        const {account, password} = req.body;
        const pass = password
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
                password: pass
            },
            streamToken: streamToken
        });
        console.log("id user chat = ", user._id);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi hệ thống khi đăng nhập!'});
    }
});

router.post('/login1', async (req, res) => {
    try {
        const {account, password} = req.body;

        // Tìm người dùng theo tài khoản
        const user = await Users.findOne({account});
        if (!user) {
            return res.status(404).json({message: 'Tài khoản không tồn tại!'});
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({message: 'Mật khẩu không đúng!'});
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
            streamToken: streamToken
        });
        console.log("id user chat = ", user._id);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi hệ thống khi đăng nhập!'});
    }
});


router.put('/updateUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const {account, password, birthday, name, nickname, bio, avatar, accountType} = req.body;

        // Find the user by ID
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'Không tìm thấy người dùng với ID cung cấp!'});
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
        res.json({message: 'Người dùng đã được cập nhật thành công!', user});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi khi cập nhật người dùng!'});
    }
});

router.post('/checkEmail', async (req, res) => {
    try {
        const {account} = req.body;

        // Check if email is provided
        if (!account) {
            return res.status(400).json({message: 'Vui lòng cung cấp email!'});
        }

        // Find the user by email
        const user = await Users.findOne({account});
        if (user) {
            return res.status(200).json({exists: true, message: 'Email đã tồn tại!', account});
        } else {
            return res.status(200).json({exists: false, message: 'Email chưa được sử dụng!', account});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi hệ thống khi kiểm tra email!'});
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Lấy danh sách người dùng (hỗ trợ tìm kiếm và phân trang)
router.get('/getListUserQT', async (req, res) => {
    const {search, page = 1, limit = 10} = req.query;
    try {
        const query = search ? {name: {$regex: search, $options: 'i'}} : {};
        const users = await Users.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await Users.countDocuments(query);

        res.json({users, total});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// Thêm người dùng mới
router.post('/createUserQT', async (req, res) => {
    const {
        account,
        password,
        birthday,
        name,
        nickname,
        bio,
        avatar,
        accountType,
        following,
        followers,
        posts
    } = req.body;

    if (!account || !password || !birthday || !name || !nickname || !avatar || !accountType || !following || !followers || !posts) {
        return res.status(400).json({message: 'Vui lòng cung cấp đầy đủ thông tin nhân viên!'});
    }

    try {
        const newUser = new Users({
            account,
            password,
            birthday,
            name,
            nickname,
            bio,
            avatar,
            accountType,
            following,
            followers,
            posts
        });
        await newUser.save();
        res.status(201).json({message: 'Nhân viên đã được tạo thành công!', user: newUser});
    } catch (error) {
        res.status(500).json({message: 'Lỗi khi tạo nhân viên!'});
    }
});

// Lấy thông tin user theo ID
router.get('/getUserQT/:id', async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({message: 'Không tìm thấy người dùng!'});
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message: 'Lỗi khi lấy thông tin người dùng!'});
    }
});

// Cập nhật thông tin người dùng
router.put('/updateUserQT/:id', async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({message: 'Không tìm thấy người dùng!'});
        }

        // Cập nhật các trường có trong body
        Object.keys(req.body).forEach(key => {
            if (req.body[key] != null) {
                user[key] = req.body[key];
            }
        });

        await user.save();
        res.status(200).json({message: 'Người dùng đã được cập nhật thành công!', user});
    } catch (error) {
        res.status(500).json({message: 'Lỗi khi cập nhật người dùng!'});
    }
});

// Xóa người dùng
router.delete('deleteUserQT/:id', async (req, res) => {
    try {
        await Users.findByIdAndDelete(req.params.id);
        res.json({message: 'User deleted'});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// Thống kê
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await Users.countDocuments();
        const accountTypes = await Users.aggregate([
            {$group: {_id: '$accountType', count: {$sum: 1}}},
        ]);
        res.json({totalUsers, accountTypes});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

router.post('/loginweb', async (req, res) => {
    try {
        const {account, password} = req.body;
        console.log("Dữ liệu nhận được từ client:", req.body.account);

        // Kiểm tra tài khoản
        const user = await Users.findOne({account: account});
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


        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                name: user.name,
                account: user.account,
                avatar: user.avatar,
                accountType: user.accountType
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi hệ thống khi đăng nhập!'});
    }
});

router.post('/changepassword', async (req, res) => {
    try {
        const {oldPassword, newPassword} = req.body;

        // Xác thực token từ cookie hoặc header
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({message: 'Bạn chưa đăng nhập!'});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Users.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({message: 'Không tìm thấy tài khoản!'});
        }

        // Xác thực mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({message: 'Mật khẩu cũ không đúng!'});
        }

        // Hash mật khẩu mới và lưu lại
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({message: 'Đổi mật khẩu thành công!'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Lỗi hệ thống khi đổi mật khẩu!'});
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
        case "week": // Trong tuần
            const weekDay = now.getDay();
            const mondayOffset = weekDay === 0 ? -6 : 1 - weekDay;

            startDate = new Date(now);
            startDate.setDate(now.getDate() + mondayOffset);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case "month": // Trong tháng
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case "custom": // Tuỳ chỉnh
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            // Điều chỉnh endDate để bao gồm toàn bộ ngày cuối (23:59:59.999)
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            throw new Error("Invalid filter type");
    }

    // Điều chỉnh múi giờ +7
    startDate = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
    endDate = new Date(endDate.getTime() + 7 * 60 * 60 * 1000);

    return {startDate, endDate};
}


router.get("/getUserByLastLog", async (req, res) => {
    const {filterType, startDate, endDate, accountType} = req.query;

    try {
        // Xác định khoảng thời gian dựa vào filterType
        const {startDate: start, endDate: end} = getDateRange(filterType, startDate, endDate);

        console.log("Start date:", start); // Log ngày bắt đầu
        console.log("End date:", end); // Log ngày kết thúc

        // Tạo danh sách các ngày trong khoảng từ start đến end
        const dates = [];
        let currentDate = new Date(start);
        while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1); // Tăng ngày lên 1
        }

        // Truy vấn tất cả người dùng trong khoảng thời gian
        const query = {
            lastLog: {$gte: start, $lte: end}
        };

        // Thêm điều kiện accountType nếu có
        if (accountType) {
            query.accountType = accountType;
        }

        const users = await Users.find(query);

        // Gom nhóm người dùng theo từng ngày
        const result = dates.map(date => {
            const formattedDate = date.toISOString().split("T")[0]; // Format YYYY-MM-DD
            const usersForDate = users.filter(user => {
                const logDate = new Date(user.lastLog).toISOString().split("T")[0];
                return logDate === formattedDate;
            });
            return {
                date: formattedDate,
                users: usersForDate
            };
        });

        res.status(200).json({success: true, data: result});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
});

module.exports = router;
