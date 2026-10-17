// src/middleware/validate.js

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        ...req.body,
        ...req.query,
        ...req.params,
    });

    if (!result.success) {
        const details = result.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return res.status(400).json({
            error: true,
            message: 'Error de validación',
            details,
        });
    }

    req.validated = result.data;
    next();
};

export default validate;
