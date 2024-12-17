import mongoose from "mongoose";


const schema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: [true, "Please Enter Name"],
            trim:true,
        },

        photo:{
            type: String,
            required: [true, "Please Enter Photo"],
            trim:true,
        },

        price:{
            type: Number,
            required: [true, "Please Enter Price"],
            trim:true,
        },

        stock:{
            type: Number,
            required: [true, "Please Enter Name"],
            trim:true,
        },

        category:{
            type: String,
            required: [true, "Please Enter Product Category"],
            trim:true,
        },
    },
    {
        timestamps: true,
    }

)


export const Product = mongoose.model("Product", schema)



