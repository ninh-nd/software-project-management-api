import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Account } from '../../models/account.js';
import { ThirdParty } from '../../models/thirdParty.js';
import { Member } from '../../models/member.js';
import { ProjectManager } from '../../models/projectManager.js';
import { successResponse, errorResponse } from '../../utils/responseFormat.js';

async function getRole(accountId) {
  const member = await Member.findOne({ account: accountId });
  const projectManager = await ProjectManager.findOne({ account: accountId });
  if (member) {
    return {
      role: 'member',
      id: member._id,
    };
  }
  if (projectManager) {
    return {
      role: 'projectManager',
      id: projectManager._id,
    };
  }
  return null;
}

async function get(req, res) {
  try {
    const account = await Account.findById(req.params.id);
    return res.status(200).json(successResponse(account, 'Account found'));
  } catch (error) {
    return res.status(500).json(errorResponse('Internal server error'));
  }
}

async function create(req, res) {
  const { username, password, email } = req.body;
  // Check if account exists
  const accountExists = await Account.findOne({ username });
  if (accountExists) {
    return res.status(409).json(errorResponse('Username already exists'));
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  // Create account
  try {
    const newAccount = new Account({
      username,
      password: hashedPassword,
      email,
    });
    await newAccount.save();
    return res.status(201).json(successResponse(newAccount, 'Account created'));
  } catch (error) {
    return res.status(500).json(errorResponse('Internal server error'));
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  const account = await Account.findOne({ username });
  if (!account) {
    return res.status(404).json(errorResponse('Username not found'));
  }
  try {
    const { _id: accountId } = account;
    const result = await bcrypt.compare(password, account.password);
    if (result) {
      const accessToken = jwt.sign({ accountId }, process.env.ACCESS_TOKEN_SECRET);
      const refreshToken = jwt.sign({ accountId }, process.env.REFRESH_TOKEN_SECRET);
      const roleObject = await getRole(accountId);
      const { role, id } = roleObject;
      const data = {
        role, id, username, accessToken, refreshToken,
      };
      return res.status(201).json(successResponse(data, 'Login successful'));
    }
    return res.status(401).json(errorResponse('Incorrect password'));
  } catch (error) {
    return res.status(500).json(errorResponse('Internal server error'));
  }
}

async function addThirdPartyToAccount(req, res) {
  // Check if account exists
  const account = await Account.findById(req.params.id);
  if (!account) {
    return res.status(404).json(errorResponse('Account not found'));
  }
  // Add third party account to account
  try {
    const { name, username, url } = req.body;
    const newThirdParty = new ThirdParty({
      name,
      username,
      url,
    });
    account.thirdParty.push(newThirdParty);
    await account.save();
    return res.status(200).json(successResponse(account, 'Third party account added'));
  } catch (error) {
    return res.status(500).json(errorResponse('Internal server error'));
  }
}

async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json(errorResponse('Missing old or new password'));
  }
  // Check if account exists
  const account = await Account.findById(req.params.id);
  if (!account) {
    return res.status(404).json(errorResponse('Account not found'));
  }
  // Check if old password is correct
  const isMatch = await bcrypt.compare(oldPassword, account.password);
  if (!isMatch) {
    return res.status(400).json(errorResponse('Incorrect old password'));
  }
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  // Change password
  account.password = hashedPassword;
  await account.save();
  return res.status(200).json(successResponse(account, 'Password changed'));
}

export {
  get, create, login, addThirdPartyToAccount, changePassword,
};
