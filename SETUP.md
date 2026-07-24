# সেটআপ গাইড

এই সাইট এখন placeholder কনটেন্ট দিয়ে standalone কাজ করবে (config.json ছাড়াই দেখা যাবে)। Admin panel দিয়ে লাইভ কনটেন্ট ম্যানেজ করতে চাইলে নিচের ধাপগুলো অনুসরণ করো।

## ১. Firebase প্রজেক্ট তৈরি
1. https://console.firebase.google.com → **Add project**
2. **Build → Realtime Database** → Create Database (production mode)
3. **Build → Authentication → Sign-in method** → Email/Password চালু করো
4. **Authentication → Users → Add user** দিয়ে নিজের admin ইমেইল+পাসওয়ার্ড তৈরি করো (এইটাই admin.html-এ লগইন করার জন্য ব্যবহার হবে)
5. প্রজেক্ট Settings → General → "Your apps" → Web app (</>) যোগ করো, config অবজেক্টটা কপি করো
6. সেটা `config.json`-এর `"firebase"` অংশে বসাও

## ২. Database Rules (জরুরি — নাহলে যে কেউ ডাটা লিখতে পারবে)
Realtime Database → Rules ট্যাবে গিয়ে এটা বসাও:
```json
{
  "rules": {
    "messages": { ".read": "auth != null", ".write": true },
    ".read": true,
    ".write": "auth != null"
  }
}
```
এতে যে কেউ contact ফর্মে বার্তা পাঠাতে পারবে, কিন্তু বাকি সব ডাটা (profile/projects/etc) শুধু লগইন করা admin-ই বদলাতে পারবে।

## ৩. Cloudinary সেটআপ (ছবি হোস্টিং)
1. https://cloudinary.com → ফ্রি অ্যাকাউন্ট খোলো, Dashboard থেকে **Cloud name** কপি করো
2. Settings → Upload → **Add upload preset** → Signing mode: **Unsigned** → সেভ করে প্রিসেট নামটা কপি করো
3. `config.json`-এর `"cloudinary"` অংশে বসাও

## ৪. GitHub Pages-এ পাবলিশ
1. একটা নতুন GitHub রিপো বানাও, এই ফোল্ডারের সব ফাইল push করো
2. Settings → Pages → Branch: main, Source: root → Save

## ⚠️ সিকিউরিটি নোট
- `config.json` পাবলিক থাকবে (এটা normal — Firebase client key এভাবেই কাজ করে) — কিন্তু **কখনও admin email/password এই ফাইলে বসিও না**। লগইন হয় Firebase Authentication দিয়ে, যেটা আলাদা ও সুরক্ষিত।
- ধাপ ২-এর Database Rules বাদ দিও না — এটা ছাড়া যে কেউ তোমার সাইটের ডাটা মুছে/বদলে দিতে পারবে।
