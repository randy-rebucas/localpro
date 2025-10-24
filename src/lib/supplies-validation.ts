// Validation utilities for supplies API

export interface SupplyValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  description: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  price: {
    required: boolean;
    min: number;
    max: number;
  };
  stock: {
    required: boolean;
    min: number;
    max: number;
  };
  category: {
    required: boolean;
    allowedValues: string[];
  };
  type: {
    required: boolean;
    allowedValues: string[];
  };
  status: {
    required: boolean;
    allowedValues: string[];
  };
}

export const SUPPLY_VALIDATION_RULES: SupplyValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  price: {
    required: true,
    min: 0.01,
    max: 999999.99
  },
  stock: {
    required: true,
    min: 0,
    max: 999999
  },
  category: {
    required: true,
    allowedValues: [
      'Cleaning Supplies',
      'Tools & Equipment',
      'Building Materials',
      'Safety Equipment',
      'Office Supplies',
      'Maintenance Kits',
      'Other'
    ]
  },
  type: {
    required: true,
    allowedValues: ['cleaning', 'tools', 'materials', 'equipment', 'subscription']
  },
  status: {
    required: true,
    allowedValues: ['available', 'out-of-stock', 'discontinued', 'pre-order']
  }
};

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export function validateSupplyData(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate name
  if (SUPPLY_VALIDATION_RULES.name.required && (!data.name || typeof data.name !== 'string')) {
    errors.push({
      field: 'name',
      message: 'Name is required',
      code: 'REQUIRED'
    });
  } else if (data.name) {
    if ((data.name as string).length < SUPPLY_VALIDATION_RULES.name.minLength) {
      errors.push({
        field: 'name',
        message: `Name must be at least ${SUPPLY_VALIDATION_RULES.name.minLength} characters long`,
        code: 'MIN_LENGTH'
      });
    }
    if ((data.name as string).length > SUPPLY_VALIDATION_RULES.name.maxLength) {
      errors.push({
        field: 'name',
        message: `Name must be no more than ${SUPPLY_VALIDATION_RULES.name.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
    }
  }

  // Validate description
  if (SUPPLY_VALIDATION_RULES.description.required && (!data.description || typeof data.description !== 'string')) {
    errors.push({
      field: 'description',
      message: 'Description is required',
      code: 'REQUIRED'
    });
  } else if (data.description) {
    if ((data.description as string).length < SUPPLY_VALIDATION_RULES.description.minLength) {
      errors.push({
        field: 'description',
        message: `Description must be at least ${SUPPLY_VALIDATION_RULES.description.minLength} characters long`,
        code: 'MIN_LENGTH'
      });
    }
    if ((data.description as string).length > SUPPLY_VALIDATION_RULES.description.maxLength) {
      errors.push({
        field: 'description',
        message: `Description must be no more than ${SUPPLY_VALIDATION_RULES.description.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
    }
  }

  // Validate price
  if (SUPPLY_VALIDATION_RULES.price.required && (data.price === undefined || data.price === null)) {
    errors.push({
      field: 'price',
      message: 'Price is required',
      code: 'REQUIRED'
    });
  } else if (data.price !== undefined && data.price !== null) {
    const price = parseFloat(data.price as string);
    if (isNaN(price)) {
      errors.push({
        field: 'price',
        message: 'Price must be a valid number',
        code: 'INVALID_TYPE'
      });
    } else if (price < SUPPLY_VALIDATION_RULES.price.min) {
      errors.push({
        field: 'price',
        message: `Price must be at least ${SUPPLY_VALIDATION_RULES.price.min}`,
        code: 'MIN_VALUE'
      });
    } else if (price > SUPPLY_VALIDATION_RULES.price.max) {
      errors.push({
        field: 'price',
        message: `Price must be no more than ${SUPPLY_VALIDATION_RULES.price.max}`,
        code: 'MAX_VALUE'
      });
    }
  }

  // Validate stock
  if (SUPPLY_VALIDATION_RULES.stock.required && (data.stock === undefined || data.stock === null)) {
    errors.push({
      field: 'stock',
      message: 'Stock is required',
      code: 'REQUIRED'
    });
  } else if (data.stock !== undefined && data.stock !== null) {
    const stock = parseInt(data.stock as string);
    if (isNaN(stock)) {
      errors.push({
        field: 'stock',
        message: 'Stock must be a valid integer',
        code: 'INVALID_TYPE'
      });
    } else if (stock < SUPPLY_VALIDATION_RULES.stock.min) {
      errors.push({
        field: 'stock',
        message: `Stock must be at least ${SUPPLY_VALIDATION_RULES.stock.min}`,
        code: 'MIN_VALUE'
      });
    } else if (stock > SUPPLY_VALIDATION_RULES.stock.max) {
      errors.push({
        field: 'stock',
        message: `Stock must be no more than ${SUPPLY_VALIDATION_RULES.stock.max}`,
        code: 'MAX_VALUE'
      });
    }
  }

  // Validate category
  if (SUPPLY_VALIDATION_RULES.category.required && (!data.category || typeof data.category !== 'string')) {
    errors.push({
      field: 'category',
      message: 'Category is required',
      code: 'REQUIRED'
    });
  } else if (data.category && !SUPPLY_VALIDATION_RULES.category.allowedValues.includes(data.category as string)) {
    errors.push({
      field: 'category',
      message: `Category must be one of: ${SUPPLY_VALIDATION_RULES.category.allowedValues.join(', ')}`,
      code: 'INVALID_VALUE'
    });
  }

  // Validate type
  if (SUPPLY_VALIDATION_RULES.type.required && (!data.type || typeof data.type !== 'string')) {
    errors.push({
      field: 'type',
      message: 'Type is required',
      code: 'REQUIRED'
    });
  } else if (data.type && !SUPPLY_VALIDATION_RULES.type.allowedValues.includes(data.type as string)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${SUPPLY_VALIDATION_RULES.type.allowedValues.join(', ')}`,
      code: 'INVALID_VALUE'
    });
  }

  // Validate status
  if (SUPPLY_VALIDATION_RULES.status.required && (!data.status || typeof data.status !== 'string')) {
    errors.push({
      field: 'status',
      message: 'Status is required',
      code: 'REQUIRED'
    });
  } else if (data.status && !SUPPLY_VALIDATION_RULES.status.allowedValues.includes(data.status as string)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${SUPPLY_VALIDATION_RULES.status.allowedValues.join(', ')}`,
      code: 'INVALID_VALUE'
    });
  }

  return errors;
}

export function validateOrderData(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.supplyId || typeof data.supplyId !== 'string') {
    errors.push({
      field: 'supplyId',
      message: 'Supply ID is required',
      code: 'REQUIRED'
    });
  }

  if (!data.quantity || typeof data.quantity !== 'number' || data.quantity < 1) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be a positive number',
      code: 'INVALID_VALUE'
    });
  }

  if (!data.shippingAddress || typeof data.shippingAddress !== 'object') {
    errors.push({
      field: 'shippingAddress',
      message: 'Shipping address is required',
      code: 'REQUIRED'
    });
  } else if (data.shippingAddress) {
    const address = data.shippingAddress as Record<string, unknown>;
    if (!address.name || !address.address || !address.city || !address.state) {
      errors.push({
        field: 'shippingAddress',
        message: 'Shipping address must include name, address, city, and state',
        code: 'INCOMPLETE'
      });
    }
  }

  return errors;
}

export function validateReviewData(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.rating || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    errors.push({
      field: 'rating',
      message: 'Rating must be between 1 and 5',
      code: 'INVALID_VALUE'
    });
  }

  if (!data.comment || typeof data.comment !== 'string' || data.comment.trim().length < 10) {
    errors.push({
      field: 'comment',
      message: 'Comment must be at least 10 characters long',
      code: 'MIN_LENGTH'
    });
  }

  return errors;
}
