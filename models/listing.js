const mongoose = require("mongoose");
const reviews = require("./review.js");
const { ref } = require("joi");
const Schema = mongoose.Schema;
const Review=require("./review.js")

const listingSchema = new Schema({
  vname:String,
  vtype:{
    type:String,
    enum:["car","bike","electric_car", "electric_bike","trending"],
    required:true
  },
  vfuel:String,
  vlimit:Number,
  vpower:Number,
  vinfo:String,
  image:
     {
      url: String,
      filename: String,
      },
  cost:Number,
  location:String,
  city:{
    type:String,
    required:true
  },
  state:String,
  reviews:[
   {
      type:Schema.Types.ObjectId,
      ref:"Review"
   }
  ],
  owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
  },
  geometry:{
    type:{
      type:String,
      enum:["Point"],
      
    },
    coordinates:{
      type:[Number],
      required:true
    },
  }
});

listingSchema.post("findOneAndDelete", async (listing)=>{
   if(listing) {
     await Review.deleteMany({_id : {$in: listing.reviews}})
   }
})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;