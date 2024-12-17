import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import {faker} from "@faker-js/faker"
import {ProductDocument} from "../types/types.js"
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";


// Revalidate on New, Update, or Delete Products &/or New Order 
export const getLatestProducts = TryCatch(
    async (
        req,res, next
    ) => {

        let products
        if (myCache.has("latest-produts"))
            products = JSON.parse(myCache.get("latest-products")as string)
        else{

        // Sort the latest products on the basis of created at and will display only 5 i.e. limit 
        products = await Product.find({}).sort({createdAt: -1}).limit(5)
        
        myCache.set("latest-products", JSON.stringify(products))
        }


        return res.status(201).json({
            success:true,
            products,
    })
})


// Revalidate on New, Update, or Delete Products &/or New Order
export const getAllCategories = TryCatch(
    async (
        req, res, next
    ) => {

        let categories

        if (myCache.has("categories"))
            categories = JSON.parse(myCache.get("categories")as string)
        else{
            categories = await Product.distinct("category")
            myCache.set("categories", JSON.stringify(categories))

        }


        return res.status(200).json({
            success:true,
            categories,
    })
})


// Revalidate on New, Update, or Delete Products &/or New Order
export const getAdminProducts = TryCatch(
    async (
        req,res, next
    ) => {
        
        let products

        if (myCache.has("all-products"))
            products = JSON.parse(myCache.get("all-products")as string)

        else{
            products = await Product.find({})
            myCache.set("all-products", JSON.stringify(products))
        }

        // Sort the latest products on the basis of created at and will display only 5 i.e. limit 
        return res.status(201).json({
            success:true,
            products,
    })
})


export const getSingleProduct = TryCatch(
    async (
        req,res, next
    ) => {

        let product
        const id = req.params.id

        if (myCache.has(`product-${id}`)) 
            product = JSON.parse(myCache.get(`product-${id}`)as string)

        
        else {
            product = await Product.findById(id)
            
            if (!product)
                return next(new ErrorHandler("Product Not Found", 404))
            
            myCache.set(`product-${id}`, JSON.stringify(product))

            }


        
        return res.status(201).json({
            success:true,
            product,
    })
})


// Code-block for to Create New Product -POST
export const newProduct = TryCatch(
    async (
        req:Request<{},{}, NewProductRequestBody >, 
        res, 
        next
    ) => {
        const  {name, price, stock, category} = req.body
        const photo = req.file

    if(!photo) 
        return next (new ErrorHandler("Please add Photo", 400))

    if (!name || !price || !stock || !category)
    {
        rm(photo.path, ()=> {
            console.log("Deleted")
        })
    
        return next (new ErrorHandler("Please Add All Fields", 400))
    }
await Product.create({
    name, 
    price, 
    stock, 
    category:category.toLowerCase(), 
    photo:photo.path,
})

invalidateCache({product:true, admin: true,})
    return res.status(201).json({
        success:true,
        message: "Product Created Successfully"
    })
})




export const updateProduct = TryCatch(
    async (
        req, 
        res, 
        next
    ) => {
        const {id} = req.params
        const  {name, price, stock, category} = req.body
        const photo = req.file
        const product = await Product.findById(id)

        if (!product)
            return next (new ErrorHandler("Product Not Found", 404))

        if(photo) 
            {
                rm(product.photo!, ()=> {
                    console.log("Old Photo Deleted")
                })

                product.photo = photo.path
            
            }

            if (name)
                product.name = name;
            if (price)
                product.price = price
            if (stock)
                product.stock = stock
            if (category)
                product.category = category

            await product.save()

            invalidateCache({product:true, productId: String(product._id), admin: true,})

            return res.status(200).json({
                success:true,
                message: "Product Updated Successfully"
            })
})


export const deleteProduct = TryCatch(
    async (
        req,res, next
    ) => {

        const product = await Product.findById(req.params.id)

        if (!product)
        {
            return next (new ErrorHandler("Product Not Found", 404))
        }

        // Remove the photo file if it exists
        rm(product.photo!, ()=> {
            console.log("Product Phto Deleted")
        })

         // Delete the specific product using its unique ID
        await Product.deleteOne({ _id: product._id });

        invalidateCache({
            product:true, 
            productId: String(product._id), 
            admin: true,})
        
        return res.status(201).json({
            success:true,
            message:"Product Deleted SUccessfully"
    })
})

// For searching Products - getAllProducts by 6pack programmer
export const searchAllProducts = TryCatch(
    async (
        req:Request<{}, {}, {}, SearchRequestQuery>,
        res:Response,
        next:NextFunction
    ) => {

        const {search, sort, category, price} = req.query

        const page = Number(req.query.page) || 1

        // if page 2 then skip the 
        const limit = Number(process.env.PRODUCT_PER_PAGE) || 8

        const skip = (page - 1) * limit

        const baseQuery: BaseQuery = {
             
        }


        if (search)
            baseQuery.name = {
                $regex:search, 
                $options:"i"
            }

            if (price)
                baseQuery.price = {
                    $lte:Number(price), 
                }

                // Not neessary to create a syntaz as bcz of key value pair
                if (category)
                    baseQuery.category=category

                const productsPromise = Product.find(baseQuery)
                // Sort Shortcut Ternary Operator, -1 ascending and 1 is descending
                .sort( sort && {price:sort === "asc" ? 1 : -1})
                .limit(limit)
                .skip(skip)

                const [products, filteredOnlyProduct] = await Promise.all([
                    productsPromise, 
                    Product.find(baseQuery)
                ])


                const totalPage = Math.ceil(filteredOnlyProduct.length / limit)

    return res.status(201).json({
        success:true,
        products,
        totalPage,
    })
})


// To Generate Fake Products its DOne 
// export const generateRandomProducts = async (count: number = 10) => {
//     const products: ProductDocument[] = []; // Explicitly typed array

//     for (let i = 0; i < count; i++) {
//         const product: ProductDocument = {
//             name: faker.commerce.productName(),
//             photo: "uploads\\b11ad915-6a57-4b00-a909-54fa472e5384.jpg", // Placeholder image path
//             price: Number(faker.commerce.price({ min: 1500, max: 80000, dec: 0 })),
//             stock: Number(faker.commerce.price({ min: 0, max: 100, dec: 0 })),
//             category: faker.commerce.department().toLowerCase(),
//             createdAt: new Date(faker.date.past()),
//             updatedAt: new Date(faker.date.recent()),
//             __v: 0,
//         };

//         products.push(product);
//     }

//     // Insert into the database
//     await Product.insertMany(products);

//     console.log({ success: true, message: `${products.length} products generated` });
// };

// // Call the function to generate 40 random products
// generateRandomProducts(40);


// Deleting the Fake Products Generated
// const deleteRandomProducts = async (count: number = 10) => {
//     const products = await Product.find({}).skip(2)

//     for (let i = 0; i < products.length; i++){
//         const product = products[i]
//         await product.deleteOne()
//     }

//     console.log({success: true})
// }

// deleteRandomProducts(38)