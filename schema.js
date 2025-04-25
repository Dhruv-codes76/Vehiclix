const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        vname: Joi.string().required(),
        vtype:Joi.string().required(),
        vfuel:Joi.string().required(),
        vlimit:Joi.number().required().min(50),
        vpower:Joi.number().required(),
        vinfo: Joi.string().required(),
        image:Joi.string().allow("",null),
        cost: Joi.number().required().min(0),
        location: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
    }).required()
})


module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().required()
    }).required()
})