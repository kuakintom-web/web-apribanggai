const Joi = require('joi');

// Validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/[A-Z]/).pattern(/[0-9]/).required(),
    full_name: Joi.string().min(3).required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  }),

  // Berita schema
  createBerita: Joi.object({
    title: Joi.string().min(5).required(),
    content: Joi.string().min(20).required(),
    excerpt: Joi.string().max(500).optional(),
    category: Joi.string().optional(),
    scope: Joi.string().valid('kabupaten', 'kecamatan').required(),
    kecamatan_id: Joi.number().optional(),
  }),

  // Pendaftaran schema
  createPendaftaran: Joi.object({
    groom_name: Joi.string().required(),
    groom_birthdate: Joi.date().required(),
    groom_birthplace: Joi.string().required(),
    groom_ktp: Joi.string().length(16).required(),
    groom_address: Joi.string().required(),
    groom_religion: Joi.string().required(),
    bride_name: Joi.string().required(),
    bride_birthdate: Joi.date().required(),
    bride_birthplace: Joi.string().required(),
    bride_ktp: Joi.string().length(16).required(),
    bride_address: Joi.string().required(),
    bride_religion: Joi.string().required(),
    marriage_date: Joi.date().required(),
    marriage_location: Joi.string().required(),
    witness1_name: Joi.string().required(),
    witness2_name: Joi.string().required(),
    desa_id: Joi.number().required(),
  }),
};

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw { status: 400, details };
  }

  return value;
};

module.exports = {
  schemas,
  validate,
};
