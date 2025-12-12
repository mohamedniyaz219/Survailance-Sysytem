const axios = require('axios');
const socketService = require('./socketService');

/**
 * AI Integration Service
 * Receives detection data from ML service and triggers alerts
 */
class AIIntegrationService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  }

  /**
   * Send frame to ML service for detection
   */
  async detectThreats(frameData, cameraId, tenantId) {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/detect`, {
        frame: frameData,
        cameraId
      });

      const detections = response.data;

      // If threats detected, trigger alert
      if (detections.fire_detected || detections.weapon_detected) {
        await this.triggerAlert({
          tenantId,
          cameraId,
          detections,
          timestamp: new Date()
        });
      }

      return detections;
    } catch (error) {
      console.error('ML service error:', error);
      throw error;
    }
  }

  /**
   * Trigger real-time alert through socket
   */
  async triggerAlert(alertData) {
    // Save to database (implementation depends on your DB model)
    // await AlertModel.create(alertData);

    // Emit real-time notification
    socketService.emitAlert(alertData.tenantId, {
      type: alertData.detections.fire_detected ? 'fire' : 'weapon',
      cameraId: alertData.cameraId,
      timestamp: alertData.timestamp,
      severity: 'high'
    });
  }
}

module.exports = new AIIntegrationService();
