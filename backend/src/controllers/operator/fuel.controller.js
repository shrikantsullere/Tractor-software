import * as fuelService from '../../services/fuel.service.js';

export const addFuelLog = async (req, res) => {
  try {
    const log = await fuelService.addFuelLog(req.user.id, req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getFuelHistory = async (req, res) => {
  try {
    const history = await fuelService.getFuelHistory(req.user.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFuelSummary = async (req, res) => {
  try {
    const summary = await fuelService.getFuelSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
