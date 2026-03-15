import Joi from 'joi';

const mongoId = Joi.string().hex().length(24);  // ─── Reusable Validators
const schemas = {
    addToCart: Joi.object({
        productId: mongoId.required(),
        quantity: Joi.number().integer().min(1).default(1),
    }),
    updateQuantity: Joi.object({
        quantity: Joi.number().integer().min(1).required(),
    }),
    params: (name) => Joi.object({
        [name]: mongoId.required(),
    }),
};

const validate = (schema , source = 'body') => (req, res, next) => {
    const target = typeof schema === 'function' ? schema(Object.keys(req[source][0])) : schema;
    const {error , value} = target.validate(req[source],{
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
    if (error) {
        return res.status(422).json({
        errors: error.details.map((d) => ({ field: d.path.join("."), message: d.message })),
        });
    }
};