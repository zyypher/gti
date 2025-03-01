self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.message,
            icon: '/images/gulbahar-logodark.png', // ✅ Your app icon
            // badge: '/icons/badge-72x72.png', // ✅ Optional badge
            data: { url: data.url }, // ✅ Click action
        })
    );
});

// ✅ Handle Notification Click
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
