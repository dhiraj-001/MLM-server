import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 50
    },
    proofImage : {
        type: String,
    },
    transactionId: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    accountDetails: {
        accountNumber: {
            type: String,
            default: "Not Provided"
        },
        bankName: {
            type: String,
            default: "Not Provided"
        },
        ifscCode: {
            type: String,
            default: "Not Provided"
        }
    }
}, { timestamps: true });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
