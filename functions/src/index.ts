import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

if (getApps().length === 0) initializeApp();

const firestore = getFirestore();
const messaging = getMessaging();

function audienceUserIds(audience: unknown, allUserIds: string[]): string[] {
  const value = String(audience || '').trim();
  const normalized = value.toLowerCase();

  if (normalized === 'all' || normalized === 'all users' || normalized === '*') {
    return allUserIds;
  }

  if (normalized.startsWith('group:') || normalized.startsWith('group_')) {
    return [];
  }

  if (normalized.startsWith('user:')) return [value.slice(5).trim()].filter(Boolean);
  if (normalized.startsWith('specific:')) return [value.slice(9).trim()].filter(Boolean);
  return value ? [value] : [];
}

async function getAudienceUserIds(audience: unknown): Promise<string[]> {
  const normalized = String(audience || '').trim().toLowerCase();
  if (normalized !== 'all' && normalized !== 'all users' && normalized !== '*') {
    return audienceUserIds(audience, []);
  }

  const users = await firestore.collection('users').select().get();
  return users.docs.map(user => user.id);
}

async function writeHistory(
  userIds: string[],
  notificationId: string,
  data: Record<string, unknown>,
  resetReadState: boolean
) {
  const writes = userIds.map(userId => firestore
    .doc(`users/${userId}/notifications/${notificationId}`)
    .set({
      title: data.title || '',
      message: data.message || '',
      type: 'system',
      source: 'admin_notification',
      createdAt: data.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(resetReadState ? { isRead: false } : {}),
    }, { merge: true }));
  await Promise.all(writes);
}

async function sendPush(userIds: string[], title: string, message: string, notificationId: string) {
  const devices = await Promise.all(userIds.map(userId =>
    firestore.collection(`users/${userId}/devices`).where('enabled', '==', true).get()
  ));
  const tokens = devices.flatMap(snapshot => snapshot.docs
    .map(device => device.data().token)
    .filter((token): token is string => typeof token === 'string' && token.length > 0));

  for (let index = 0; index < tokens.length; index += 500) {
    const batch = tokens.slice(index, index + 500);
    if (batch.length === 0) continue;
    await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title, body: message },
      data: { notificationId },
      android: { notification: { channelId: 'default' } },
    });
  }
}

export const onAdminNotificationWritten = onDocumentWritten(
  'admin_notifications/{notificationId}',
  async event => {
    const before = event.data?.before;
    const after = event.data?.after;
    if (!after?.exists) return;

    const current = after.data() || {};
    const previous = before?.exists ? before.data() || {} : null;
    const becameActive = current.active === true && (!previous || previous.active !== true);
    if (current.active !== true) return;

    const userIds = await getAudienceUserIds(current.audience);
    if (userIds.length === 0) return;

    await writeHistory(userIds, event.params.notificationId, {
      ...current,
      createdAt: current.createdAt instanceof Timestamp ? current.createdAt : undefined,
    }, becameActive);
    if (!becameActive) return;

    await sendPush(
      userIds,
      String(current.title || 'Rupeo notification'),
      String(current.message || ''),
      event.params.notificationId
    );
  }
);
