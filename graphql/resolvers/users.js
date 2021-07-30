const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userInputError, UserInputError } = require("apollo-server");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../utils/validators");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    "thisismynewcourse",
    { expiresIn: "23h" }
  );
}
module.exports = {
  Mutation: {
    async login(parent, { username, password }) {
      const { erros, valid } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError("Errors", errors);
      }

      const user = await User.findOne({ username });

      if (!user) {
        errors.general = "User not found";
        throw new Error("User not found");
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        errors.general = "Wrong Creds!";
        throw new Error("Wrong Creds!");
      }
      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token: token,
      };
    },

    async register(
      parent,
      { registerInput: { username, email, password, confirmPassword } },
      context,
      info
    ) {
      //validate user data
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );

      if (!valid) {
        throw new UserInputError("Errors", errors);
      }
      //make sure user doesnt already exist

      const user = await User.findOne({ username });

      if (user) {
        throw new UserInputError("Username already exists!", {
          errors: "This username is taken!",
        });
      }
      //hash the password before saving it
      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
      });

      const res = await newUser.save();

      //create auth token
      const token = generateToken(res);

      console.log(token);
      return {
        ...res._doc,
        id: res._id,
        token: token,
      };
    },
  },
};
