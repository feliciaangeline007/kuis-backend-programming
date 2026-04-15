const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');
const { hashPassword, passwordMatched } = require('../../../utils/password');

async function getUsers(request, response, next) {
  try {
    const users = await usersService.getUsers();

    return response.status(200).json(users);
  } catch (error) {
    return next(error);
  }
}

async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'User not found');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

async function createUser(request, response, next) {
  try {
    const {
      email,
      password,
      full_name: fullName,
      confirm_password: confirmPassword,
    } = request.body;

    // Email is required and cannot be empty
    if (!email) {
      throw errorResponder(errorTypes.VALIDATION_ERROR, 'Email is required');
    }

    // Full name is required and cannot be empty
    if (!fullName) {
      throw errorResponder(
        errorTypes.VALIDATION_ERROR,
        'Full name is required'
      );
    }

    // Email must be unique
    if (await usersService.emailExists(email)) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email already exists'
      );
    }

    // The password is at least 8 characters long
    if (password.length < 8) {
      throw errorResponder(
        errorTypes.VALIDATION_ERROR,
        'Password must be at least 8 characters long'
      );
    }

    // The password and confirm password must match
    if (password !== confirmPassword) {
      throw errorResponder(
        errorTypes.VALIDATION_ERROR,
        'Password and confirm password do not match'
      );
    }

    // Hash the password before saving it to the database
    const hashedPassword = await hashPassword(password);

    // Create the user
    const success = await usersService.createUser(
      email,
      hashedPassword,
      fullName
    );

    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(request, response, next) {
  try {
    const { email, full_name: fullName } = request.body;

    // User must exist
    const user = await usersService.getUser(request.params.id);
    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'User not found');
    }

    // Email is required and cannot be empty
    if (!email) {
      throw errorResponder(errorTypes.VALIDATION_ERROR, 'Email is required');
    }

    // Full name is required and cannot be empty
    if (!fullName) {
      throw errorResponder(
        errorTypes.VALIDATION_ERROR,
        'Full name is required'
      );
    }

    // Email must be unique, if it is changed
    if (email !== user.email && (await usersService.emailExists(email))) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email already exists'
      );
    }

    const success = await usersService.updateUser(
      request.params.id,
      email,
      fullName
    );

    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(request, response, next) {
  try {
    const { id } = request.params;
    const {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    } = request.body;

    const user = await usersService.getUser(id);
    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'User not found');
    }

    if (!oldPassword) {
      throw errorResponder(errorTypes.VALIDATION, 'Old password is required');
    }

    if (!newPassword) {
      throw errorResponder(errorTypes.VALIDATION, 'New password is required');
    }

    if (!confirmNewPassword) {
      throw errorResponder(
        errorTypes.VALIDATION,
        'Confirm new password is required'
      );
    }

    const isOldPasswordCorrect = await passwordMatched(
      oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Old password is wrong'
      );
    }

    if (newPassword.length < 8) {
      throw errorResponder(
        errorTypes.VALIDATION,
        'New password must be at least 8 characters long'
      );
    }

    if (oldPassword === newPassword) {
      throw errorResponder(
        errorTypes.VALIDATION,
        'New password must be different from the old password'
      );
    }

    if (newPassword !== confirmNewPassword) {
      throw errorResponder(
        errorTypes.VALIDATION,
        'New password and confirm new password do not match'
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await usersService.changePassword(id, hashedPassword);

    return response
      .status(200)
      .json({ message: 'Password changed successfully' });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(request, response, next) {
  try {
    const success = await usersService.deleteUser(request.params.id);

    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
};
