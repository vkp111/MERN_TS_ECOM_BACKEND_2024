import express  from "express";

import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProducts, getAllCategories, getLatestProducts, getSingleProduct, newProduct, searchAllProducts, updateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";


const app = express.Router()

// Create New Product - api/vi/product/new
app.post("/new", adminOnly, singleUpload, newProduct)

// Get Search Product with filters - api/vi/product/search
app.get("/search", searchAllProducts)

// Get Latest Product - api/vi/product/latest
app.get("/latest", getLatestProducts)

// Create Categories - api/vi/product/categories
app.get("/categories", getAllCategories)

// Create New Product - api/vi/product/admin-products
app.get("/admin-products", getAdminProducts)

// Route - Get Single Product
app.get("/:id", getSingleProduct)

// Route - To Update the product
app.put("/:id", adminOnly, singleUpload, updateProduct)

// Route - To Delete the product
app.delete("/:id",adminOnly, deleteProduct)

// Chaining syntax for the above two codes
// app.route(":id").get(getSingleProduct).delete(adminOnly, deleteUser)
export default app