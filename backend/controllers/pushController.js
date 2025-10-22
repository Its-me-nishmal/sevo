const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const dotenv = require('dotenv')
dotenv.config();


// VAPID keys from environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

console.log('VAPID_PUBLIC_KEY:', publicVapidKey);
console.log('VAPID_PRIVATE_KEY:', privateVapidKey);

webpush.setVapidDetails(
  'mailto:your_email@example.com', // Replace with your email
  publicVapidKey,
  privateVapidKey
);

// Explicitly disable GCM to prevent "Must supply api_key" errors if GCM endpoints are encountered
webpush.setGCMDetails(null);

// @desc    Register a push subscription
// @route   POST /api/subscribe
// @access  Private
exports.subscribe = async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id;

  try {
    // Check if a subscription already exists for this user and endpoint
    let existingSubscription = await PushSubscription.findOne({
      userId,
      'subscription.endpoint': subscription.endpoint,
    });

    if (existingSubscription) {
      // Update existing subscription if it's different (e.g., keys changed)
      if (JSON.stringify(existingSubscription.subscription) !== JSON.stringify(subscription)) {
        existingSubscription.subscription = subscription;
        await existingSubscription.save();
        console.log(`Updated push subscription for user ${userId}`);
      } else {
        console.log(`Existing push subscription for user ${userId} is up to date.`);
      }
      return res.status(200).json({ message: 'Subscription updated successfully' });
    }

    // Create new subscription
    const newSubscription = new PushSubscription({
      userId,
      subscription,
    });

    await newSubscription.save();
    console.log(`New push subscription registered for user ${userId}`);

    res.status(201).json({ message: 'Subscription registered successfully' });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Unregister a push subscription
// @route   POST /api/unsubscribe
// @access  Private
exports.unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  const userId = req.user.id;

  try {
    await PushSubscription.deleteOne({ userId, 'subscription.endpoint': endpoint });
    console.log(`Push subscription unregistered for user ${userId} with endpoint ${endpoint}`);
    res.status(200).json({ message: 'Subscription unregistered successfully' });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Function to send push notification
exports.sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
        console.log(`Push notification sent to user ${userId}`);
      } catch (error) {
        console.error(`Error sending push notification to user ${userId} (endpoint: ${sub.subscription.endpoint}):`, error);
        // If the subscription is no longer valid, remove it from the database
        if (error.statusCode === 410) { // GONE status code
          await PushSubscription.deleteOne({ _id: sub._id });
          console.log(`Removed expired subscription for user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching subscriptions or sending notifications:', error);
  }
};