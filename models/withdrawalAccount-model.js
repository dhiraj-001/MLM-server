import mongoose from 'mongoose';

const withdrawalAccountSchema = new mongoose.Schema({
    accountID: {
        type: String,
        required: true
    },
    qrImg: {
        type: String,
        required: true
    },
}, { timestamps: true });

const WithdrawalAccount = mongoose.model('WithdrawalAccount', withdrawalAccountSchema);
export default WithdrawalAccount;