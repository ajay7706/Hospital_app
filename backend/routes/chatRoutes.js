const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const AIChat = require("../models/AIChat");

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_api_key" && process.env.OPENAI_API_KEY.trim() !== "") {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (err) {
    console.error("OpenAI initialization error:", err.message);
  }
}

// Highly Resilient Rule-based Fallback Response Engine (20+ Medical Categories)
function getFallbackResponse(userMessage) {
  const cleanMsg = userMessage.trim();
  const lowerMsg = cleanMsg.toLowerCase();
  
  // 1. Script/Language Detection
  const isDevanagari = /[\u0900-\u097F]/.test(cleanMsg);
  
  const hinglishKeywords = [
    "hai", "mujhe", "mera", "dard", "drd", "bukhar", "bukar", "buhar", "seena", "saans", "sans",
    "behosh", "khoon", "chot", "hua", "hoon", "kar", "raha", "rahi", "kuch", "aap", "salah",
    "bata", "sakte", "hain", "ke", "ki", "ko", "se", "aur", "pe", "par", "khujli", "pet", "sir",
    "dil", "gaya", "gayi", "kya", "bhai", "samajh", "aaya", "koshish", "karein", "rakhein", "ghutna",
    "kamar", "aankh", "kaan", "ulti", "dast", "sugar", "ghabrahat", "sujan", "jalan"
  ];
  const isHinglish = !isDevanagari && hinglishKeywords.some(kw => lowerMsg.includes(kw));

  let lang = "en";
  if (isDevanagari) {
    lang = "hi";
  } else if (isHinglish) {
    lang = "hinglish";
  }

  // Resilient multi-keyword matching helpers
  const containsAny = (words) => words.some(w => lowerMsg.includes(w));
  const containsAll = (groups) => groups.every(group => group.some(w => lowerMsg.includes(w)));

  // Core indicators
  const painWords = ["dard", "drd", "pain", "pein", "दर्द", "तकलीफ"];
  const emergencyWords = ["chest pain", "breathing", "unconscious", "heavy bleeding", "stroke", "severe injury", "sans phool", "saans phool", "behosh", "aapat", "emergency", "छाती में दर्द", "सांस", "बेहोश", "गंभीर"];
  const bookingWords = ["appointment", "apointment", "book", "doctor milna", "booking", "milna hai", "अपॉइंटमेंट", "बुक", "डॉक्टर से मिलना"];
  const greetingWords = ["hi", "hello", "namaste", "hey", "hola", "greetings", "नमस्ते", "हेलो", "हाय"];
  const hospitalWords = ["hospital", "hospitals", "aspatal", "aspatall", "clinic", "dispensary", "अस्पताल", "क्लीनिक", "हॉस्पिटल"];

  const coughKeywords = ["cough", "kough", "khansi", "kansi", "khasi", "cold", "kold", "sardi", "zukam", "jukan", "zukham", "sore throat", "gala kharab", "खांसी", "जुकाम", "गला खराब", "स सर्दी", "कफ"];
  const weaknessKeywords = ["weakness", "weknis", "kamzori", "thakan", "tired", "dizzy", "chakkar", "chakar", "dizziness", "fatigue", "कमजोरी", "चक्कर", "थकान"];
  const toothKeywords = ["tooth", "teeth", "toothache", "dant dard", "dant drd", "dant me dard", "teeth pain", "दांत दर्द", "दांत में दर्द", "दांत"];
  const backPainKeywords = ["back pain", "backpain", "kamar dard", "kamar drd", "kamar me dard", "spine pain", "पीठ दर्द", "कमर दर्द", "कमर में दर्द"];
  const jointPainKeywords = ["joint pain", "knee pain", "ghutna dard", "ghutne me dard", "gathiya", "joint drd", "knee drd", "जोड़ों का दर्द", "घुटने में दर्द", "गठिया"];
  const eyeKeywords = ["eye pain", "aankh me dard", "aankh dard", "red eyes", "eye allergy", "irritation", "आंकड़ों में दर्द", "आँख दर्द", "आँखें लाल"];
  const earKeywords = ["ear pain", "kaan me dard", "kaan dard", "earache", "ear allergy", "कान का दर्द", "कान में दर्द"];
  const acidityKeywords = ["acidity", "gas", "esidity", "heartburn", "seene me jalan", "pet me jalan", "एसिडिटी", "गैस", "सीने में जलन"];
  const vomitingKeywords = ["vomit", "vomiting", "vomt", "ulti", "ultt", "जी मिचलाना", "उल्टी"];
  const looseMotionKeywords = ["loose motion", "loosemotion", "dast", "diarrhea", "diaria", "pet kharab", "दस्त", "पेचिश"];
  const diabetesKeywords = ["diabetes", "sugar", "diabete", "high sugar", "low sugar", "मधुमेह", "शुगर"];
  const bpKeywords = ["bp", "blood pressure", "high bp", "low bp", "bloodpressure", "रक्तचाप", "बीपी"];
  const asthmaKeywords = ["asthma", "saans phoolna", "sans fulna", "breathless", "asthma patient", "दमा", "सांस फूलना"];
  const injuryKeywords = ["injury", "wound", "chot", "zakhmi", "fracture", "chot lag", "खून", "चोट", "घाव"];
  const anxietyKeywords = ["anxiety", "stress", "ghabrahat", "tension", "tension ho", "ghabrat", "panic", "घबराहट", "तनाव"];

  const feverKeywords = ["fever", "fevr", "bukhar", "bukar", "buhar", "body pain", "badan dard", "badandard", "temp", "temperature", "बुखार", "बदन दर्द", "तापमान"];
  const headacheKeywords = ["headache", "hedake", "headake", "sir dard", "sir drd", "sirdard", "migraine", "migrane", "sir me dard", "सिर दर्द", "सिरदर्द", "माइग्रेन"];
  const skinKeywords = ["skin", "rash", "khujli", "allergy", "alerg", "pimples", "acne", "itching", "त्वचा", "खुजली", "एलर्जी", "मुंहासे", "दाने"];
  const heartKeywords = ["heart", "dil", "chest pain", "seena me dard", "seene me", "bp", "blood pressure", "हृदय", "दिल", "बीपी", "रक्तचाप"];

  // 2. Emergency Trigger Check
  if (containsAny(emergencyWords)) {
    if (lang === "hi") {
      return `🚨 **आपातकालीन सूचना** 🚨

आप जो गंभीर लक्षण बता रहे हैं, वे आपातकालीन हो सकते हैं। कृपया घबराएं नहीं, लेकिन सावधानी बरतें।

## संभावित कारण
छाती में तेज दर्द, सांस लेने में अत्यधिक कठिनाई, बेहोशी या गंभीर रक्तस्राव गंभीर हृदय रोग, फेफड़ों में खिंचाव या आकस्मिक आघात (stroke/trauma) के कारण हो सकता है।

## आप क्या कर सकते हैं
- **बिना किसी देरी के तुरंत अपने नजदीकी आपातकालीन अस्पताल या डॉक्टर से संपर्क करें।**
- आराम से बैठें या लेटें और स्वयं कोई दवा न लें।

*अभी इस एरिया के अस्पताल प्लेटफ़ॉर्म पर उपलब्ध नहीं हैं। कृपया तुरंत स्थानीय आपातकालीन एम्बुलेंस या डॉक्टर से संपर्क करें।*`;
    } else if (lang === "hinglish") {
      return `🚨 **EMERGENCY NOTICE** 🚨

Aap jo symptoms bata rahe hain, ye serious emergency ho sakte hain. Kripya shant rahein par jaldi action lein.

## Possible Reasons
Chest pain, saans lene me takleef, ya behoshi heart problems, respiratory infection ya sudden cardiac issues ki wajah se ho sakte hain.

## Aap Kya Kar Sakte Hain
- **Bina kisi deri ke turant kisi nazdiki emergency hospital ya doctor se sampark karein.**
- Physically koi activity na karein, aaram se let jayein aur khud se koi medicine na lein.

*Abhi is area ke hospitals platform par available nahi hain. Kripya local emergency services ki help lein.*`;
    } else {
      return `🚨 **EMERGENCY NOTICE** 🚨

The symptoms you are experiencing can be life-threatening. Please stay calm but act quickly.

## Possible Reasons
Severe chest discomfort, acute breathing difficulty, heavy bleeding, or unconsciousness can stem from major cardiac events, respiratory failure, or severe infection.

## What You Can Do
- **Please go to the nearest emergency hospital or contact emergency services immediately.**
- Sit down, avoid physical movement, and do not attempt to self-medicate.

*Currently, hospitals for this area are not available on the platform. Please dial emergency support numbers immediately.*`;
    }
  }

  // 3. Hospital Explicit Request Check
  if (containsAny(hospitalWords)) {
    if (lang === "hi") {
      return `अस्पतालों की जानकारी के बारे में पूछने के लिए धन्यवाद।

अभी इस एरिया के अस्पताल प्लेटफ़ॉर्म पर उपलब्ध नहीं हैं। जैसे ही अस्पताल हमारे नेटवर्क से जुड़ेंगे, आप उन्हें यहाँ देख पाएंगे। किसी भी गंभीर लक्षण के मामले में कृपया तुरंत अपने निकटतम स्थानीय चिकित्सालय से संपर्क करें।`;
    } else if (lang === "hinglish") {
      return `Hospitals ke bare me inquiry karne ke liye shukriya.

Abhi is area ke hospitals platform par available nahi hain. Jaise hi hospitals hamare server par listed honge, aap unhe online check kar payenge. Emergency me kripya local hospital me turant consult karein.`;
    } else {
      return `Thank you for inquiring about hospital recommendations.

Currently, hospitals for this area are not available on the platform. As soon as partner healthcare units register on Clinoza, you will be able to search them here. In case of emergencies, please visit your local clinic or hospital directly.`;
    }
  }

  // 4. Booking Trigger Check
  if (containsAny(bookingWords)) {
    if (lang === "hi") {
      return `मैं Clinoza प्लेटफॉर्म पर आपका अपॉइंटमेंट बुक करने में आपकी पूरी मदद कर सकता हूँ!

कृपया मुझे ये विवरण बताएं ताकि मैं आपके लिए प्रक्रिया को आसान बना सकूं:
1. आप किस विशेषज्ञ या डॉक्टर प्रकार (जैसे General Physician, Cardiologist) से मिलना चाहते हैं?
2. आपकी पसंद का दिन और समय क्या है?`;
    } else if (lang === "hinglish") {
      return `Main Clinoza platform par aapka appointment book karne me help kar sakta hoon!

Kripya mujhe yeh details batayein:
1. Aap kis doctor type (jaise General Physician, Dermatologist) se milna chahte hain?
2. Aapka preferred day aur time hai?`;
    } else {
      return `I can help you coordinate an appointment on the Clinoza platform!

Please let me know:
1. What type of specialist (e.g., General Physician, Dermatologist) do you need?
2. What is your preferred date and time?`;
    }
  }

  // 5. Fever
  if (containsAny(feverKeywords)) {
    if (lang === "hi") {
      return `मुझे यह सुनकर खेद है कि आपको बुखार है। घबराएं नहीं, मैं सहायता के लिए हूँ।

## संभावित कारण
बुखार (Fever) और शरीर में दर्द वायरल इन्फेक्शन, फ्लू, अत्यधिक थकान या किसी बैक्टीरियल संक्रमण की वजह से हो सकता है।

## आप क्या कर सकते हैं
* पर्याप्त आराम (rest) करें।
* खूब सारा पानी, नारियल पानी या ओआरएस (ORS) घोल पिएं ताकि डिहाइड्रेशन न हो।
* ठंडे पानी की पट्टी माथे पर रखें।
* हल्का और सुपाच्य भोजन (जैसे खिचड़ी) खाएं।

## डॉक्टर का सुझाव
अगर बुखार 101 डिग्री से ऊपर रहता है या 3 दिनों से अधिक समय तक बना रहता है, तो कृपया **General Physician (सामान्य चिकित्सक)** से संपर्क करें।`;
    } else if (lang === "hinglish") {
      return `Mujhe sunkar dukh hua ki aapki tabiyat kharab hai. Fever aana body ka infection se ladne ka ek natural tareeqa hai. Pareshan na ho, main aapko guide karta hoon.

## Possible Reasons
Bukhar aur badan dard viral infection, flu, extreme fatigue ya kisi basic infection ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Khoob sara aaram (rest) karein.
* Zyada se zyada paani piyen ya nariyal paani peeyein taaki dehydration na ho.
* Oily aur teekha khana avoid karein, halka khana khayein.
* Body temperature ko regular note karte rahein.

## Doctor Suggestion
Agar bukhar lagatar bana rahe ya zyada ho, to **General Physician** ko dikhaiye. Bina doctor ke advice ke koi medicine na lein.`;
    } else {
      return `I am sorry to hear that you are not feeling well. Running a fever is your body's natural defense against infection. Stay calm, and let me share some general guidance.

## Possible Reasons
A fever and body aches are commonly caused by viral infections, seasonal flu, exhaustion, or other minor bacterial conditions.

## What You Can Do
* Get plenty of bed rest to help your body recover.
* Keep yourself well-hydrated by drinking water, herbal tea, or electrolytes.
* Eat light, nutrient-rich, and easy-to-digest food.
* Monitor your body temperature regularly.

## Doctor Suggestion
If the fever exceeds 101°F or persists for more than 3 days, please consult a **General Physician**. Avoid self-medicating.`;
    }
  }

  // 6. Headache
  if (containsAny(headacheKeywords)) {
    if (lang === "hi") {
      return `मुझे खेद है कि आप सिरदर्द से परेशान हैं। यह बहुत कष्टदायक हो सकता है। कृपया कुछ देर के लिए आराम करें।

## संभावित कारण
सिरदर्द (Headache) तनाव, पर्याप्त नींद न मिलना, आंखों में खिंचाव, डिहाइड्रेशन (पानी की कमी) या माइग्रेन की वजह से हो सकता है।

## आप क्या कर सकते हैं
* एक शांत और हल्के अंधेरे कमरे में लेटकर आराम करें।
* तुरंत 1-2 बड़े गिलास पानी पिएं (पानी की कमी सिरदर्द का एक बड़ा कारण है)।
* मोबाइल, कंप्यूटर या टीवी स्क्रीन का इस्तेमाल बंद कर दें।
* माथे पर हल्के हाथों से मसाज करें या कोल्ड कंप्रेस लगाएं।

## डॉक्टर का सुझाव
सामान्य सिरदर्द के लिए **General Physician** को दिखाएं। यदि सिरदर्द बहुत तेज, असहनीय हो या बार-बार लौटता हो, तो **Neurologist (तंत्रिका विज्ञानी)** से परामर्श लें।`;
    } else if (lang === "hinglish") {
      return `Mujhe dukh hai ki aapko sir dard ho raha hai. Ye waise kafi common hai par aaram karna zaroori hai.

## Possible Reasons
Sir dard (headache) stress, dehydration, neend puri na hone, ya screen time zyada hone ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Ek shant aur andhere kamre me aaram karein.
* Ek bada glass paani piyen (dehydration headache ka bada reason hota hai).
* Mobile aur laptop screen ko abhi avoid karein.
* Light head massage kar sakte hain.

## Doctor Suggestion
Agar normal dard hai to **General Physician** ko dikhayein. Agar dard unbearable ho ya baar-baar ho, to **Neurologist** se consult karein.`;
    } else {
      return `I am sorry to hear you are dealing with a headache. Headaches can be incredibly distracting and uncomfortable.

## Possible Reasons
Headaches are commonly caused by stress, fatigue, dehydration, eye strain from screens, or underlying migraine conditions.

## What You Can Do
* Rest in a quiet, dimly lit, and well-ventilated room.
* Drink a glass or two of water immediately to rehydrate.
* Power down your phones, laptops, and television screens.
* Apply a cool damp cloth or ice pack to your forehead.

## Doctor Suggestion
For common headaches, a **General Physician** is the right place to start. For chronic, severe, or recurrent headaches, please consult a **Neurologist**.`;
    }
  }

  // 7. Skin Allergy
  if (containsAny(skinKeywords)) {
    if (lang === "hi") {
      return `त्वचा (skin) की समस्या परेशान करने वाली हो सकती है। कृपया खुजली वाली जगह को छूने से बचें।

## संभावित कारण
त्वचा पर चकत्ते, दाने या खुजली एलर्जिक रिएक्शन, किसी कॉस्मेटिक प्रोडक्ट, मौसम में बदलाव या इन्फेक्शन के कारण हो सकते हैं।

## आप क्या कर सकते हैं
* प्रभावित हिस्से को साफ और सूखा रखें।
* किसी भी नए साबुन, क्रीम या कॉस्मेटिक का इस्तेमाल तुरंत बंद करें।
* सूती (cotton) और ढीले कपड़े पहनें।
* खुजली वाले स्थान को न खुरचें।

## डॉक्टर का सुझाव
सटीक जांच और इलाज के लिए किसी **Dermatologist (त्वचा रोग विशेषज्ञ)** से संपर्क करें।`;
    } else if (lang === "hinglish") {
      return `Skin allergy ya rashes kafi irritating ho sakte hain. Kripya affected area ko touch na karein.

## Possible Reasons
Twacha par rashes, khujli, pimples ya allergy weather change, harsh soaps, cosmetics ya fungal infection ki wajah se ho sakte hain.

## Aap Kya Kar Sakte Hain
* Skin ko clean aur dry rakhein.
* Naye cosmetics, soaps ya perfume ka use abhi band kar dein.
* Itching (khujli) karne se bachein taaki infection na faile.
* Loose cotton clothes pehnein.

## Doctor Suggestion
Iske treatment aur diagnosis ke liye ek expert **Dermatologist** se consult karein.`;
    } else {
      return `Skin problems can be highly uncomfortable. Please avoid scratching the affected area to prevent irritation.

## Possible Reasons
Skin rashes, allergies, or acne outbreaks can occur due to weather changes, harsh cosmetic chemicals, allergens, or minor infections.

## What You Can Do
* Keep the affected area clean, cool, and dry.
* Avoid using scented lotions, harsh chemical soaps, or new cosmetics.
* Wear loose, breathable cotton clothing.
* Do not scratch or pick at rashes/pimples.

## Doctor Suggestion
We strongly advise speaking to a **Dermatologist** to get an accurate diagnosis and treatment.`;
    }
  }

  // 8. Heart & Chest Pain
  if (containsAny(heartKeywords)) {
    if (lang === "hi") {
      return `हृदय या रक्तचाप (BP) से जुड़ा कोई भी लक्षण संवेदनशील होता है। कृपया शांत रहें और घबराएं नहीं।

## संभावित कारण
छाती में भारीपन या उच्च रक्तचाप दिल की समस्या, गंभीर एसिडिटी, तनाव या अत्यधिक शारीरिक परिश्रम के कारण हो सकता है।

## आप क्या कर सकते हैं
* तुरंत बैठ जाएं या आरामदायक स्थिति में लेट जाएं।
* किसी भी प्रकार की शारीरिक मेहनत न करें।
* यदि आपको पूर्व में हृदय रोग की दवा दी गई है, तो उसका उपयोग करें या तुरंत मदद बुलाएं।

## डॉक्टर का सुझाव
आपको बिना देरी किए तुरंत किसी **Cardiologist (हृदय रोग विशेषज्ञ)** से मिलना चाहिए। यदि छाती में तेज दर्द हो जो बाएं हाथ या जबड़े तक फैले, तो तुरंत **Emergency** में जाएं।`;
    } else if (lang === "hinglish") {
      return `Dil ya blood pressure se judi koi bhi pareshani lag rahi hai. Isme laparwahi nahi karni chahiye, kripya aaram karein aur shant rahein.

## Possible Reasons
Chest pressure ya blood pressure heart problems, extreme stress, heavy gas/acidity ya cardiac strain ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Turant baith ya let jayein, heavy physically activity bilkul na karein.
* Shant rahein aur lambi saans lein.
* Apne family member ya dost ko inform karein.

## Doctor Suggestion
Aapko bina kisi delay ke **Cardiologist** se milna chahiye. Agar left arm dard ya heavy breathlessness ho, to bina der kiye **Emergency** room me jayein.`;
    } else {
      return `Heart-related symptoms require prompt, professional clinical evaluation. Please remain calm.

## Possible Reasons
Chest tightness can stem from cardiovascular conditions, physical strain, panic/anxiety, or severe gastric reflux.

## What You Can Do
* Sit down or lie down in a comfortable position immediately.
* Refrain from any physical movement or lifting.
* Inform someone nearby to assist you.

## Doctor Suggestion
Please consult a **Cardiologist** immediately. If you experience chest pain radiating to your left arm or jaw, seek **Emergency medical attention** right away.`;
    }
  }

  // 9. Back Pain (Resilient matching: contains kamar/back/spine AND pain/dard)
  if (containsAll([["back", "kamar", "spine", "पीठ", "कमर"], painWords])) {
    if (lang === "hi") {
      return `मुझे दुख है कि आप पीठ या कमर के दर्द से परेशान हैं। यह बहुत कष्टदायक हो सकता है।

## संभावित कारण
कमर दर्द मांसपेशियों में खिंचाव, गलत मुद्रा (poor posture) में लंबे समय तक बैठने, रीढ़ की हड्डी में दबाव या भारी सामान उठाने की वजह से हो सकता है।

## आप क्या कर सकते हैं
* सीधे सख्त बिस्तर या फर्श पर चटाई बिछाकर पीठ के बल सीधे लेटें।
* प्रभावित हिस्से पर हॉट बैग (hot water bag) से सिकाई करें या जेल लगाएं।
* लंबे समय तक एक ही जगह पर बैठकर काम करने से बचें, बीच-बीच में थोड़ा टहलें।
* कमर को सहारा देने के लिए तकिये या कुर्सी के बैक-सपोर्ट का उपयोग करें।

## डॉक्टर का सुझाव
यदि दर्द बहुत गंभीर है, पैरों में सुन्नता आ रही है या 3 दिनों से राहत नहीं है, तो कृपया **Orthopedic (हड्डी रोग विशेषज्ञ)** या **Physiotherapist** से संपर्क करें।`;
    } else if (lang === "hinglish") {
      return `Kamar me dard (back pain) kafi uncomfortable ho sakta hai. Kripya heavy weight uthane se bachein.

## Possible Reasons
Kamar dard muscle strain, galat posture me ghanto tak baithne, sudden heavy weight lifting ya spinal nerve compression ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Ek flat aur firm mattress par let kar back ko rest lein.
* Heating pad ya garam paani ki thaili se back ki warm compress (sikai) karein.
* Har 30-40 mins me chair se uth kar thoda stretch ya walk karein.
* Ergonomic chair ya back cushion ka use karein.

## Doctor Suggestion
Agar dard bohot tez ho ya dono legs me tingling/numbness feel ho, to ek **Orthopedic** doctor ya **Physiotherapist** ko dikhayein.`;
    } else {
      return `Back pain can significantly restrict your daily activities. Please avoid bending forward or lifting heavy weights.

## Possible Reasons
Back pain is commonly caused by muscle strain, poor sitting posture for long hours, sudden heavy lifting, or spinal disc compression.

## What You Can Do
* Lie flat on a firm mattress or a yoga mat on the floor to align your spine.
* Apply a warm compress or heating pad to the painful area for 15-20 minutes.
* Take short walking breaks every 45 minutes instead of sitting continuously.
* Avoid lifting any heavy loads until you recover.

## Doctor Suggestion
If the back pain is severe, radiates down to your legs, or is accompanied by numbness, please consult an **Orthopedic Specialist** or a **Physiotherapist**.`;
    }
  }

  // 10. Joint Pain / Knee pain
  if (containsAll([["joint", "knee", "ghutna", "ghutne", "gathiya", "जोड़ों", "घुटने", "गठिया"], painWords])) {
    if (lang === "hi") {
      return `जोड़ों या घुटनों में दर्द होना चलने-फिरने में बड़ी बाधा बन जाता है। कृपया प्रभावित जोड़ पर ज्यादा वजन न डालें।

## संभावित कारण
जोड़ों का दर्द बढ़ती उम्र में लुब्रिकेशन की कमी, ऑस्टियोआर्थराइटिस (osteoarthritis), यूरिक एसिड बढ़ने, पुरानी चोट या मस्कुलर ओवरलोड के कारण हो सकता है।

## आप क्या कर सकते हैं
* प्रभावित जोड़ को आराम दें और सीढ़ियां चढ़ना या उकड़ू (squat) बैठना बंद करें।
* यदि सूजन हो तो बर्फ की सिकाई (cold compress) करें, सूजन न होने पर गर्म पानी की सिकाई करें।
* वजन को नियंत्रित रखें ताकि घुटनों पर दबाव कम पड़े।
* आरामदायक फ्लैट चप्पलें पहनें।

## डॉक्टर का सुझाव
गंभीर जोड़ों के दर्द के लिए कृपया **Orthopedic (हड्डी रोग विशेषज्ञ)** या **Rheumatologist** को दिखाएं।`;
    } else if (lang === "hinglish") {
      return `Ghutne me dard ya joint pain chalne-phirne me kafi problem khadi karta hai. Affected joint par heavy pressure na dalein.

## Possible Reasons
Joint/Knee pain uric acid badhne, cartilage wear-down (osteoarthritis), hydration ki kami, ya kisi old injury ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Seediya (stairs) chadhna aur niche ukhdu baithna abhi avoid karein.
* Agar swelling (sujan) ho to ice pack lagayein, agar normal dard ho to garm sikai karein.
* Flat aur comfortable footwear pehnein.
* Haldi wala doodh piyen.

## Doctor Suggestion
Chronic joint pain ke proper treatment ke liye ek expert **Orthopedic Specialist** ko dikhayein.`;
    } else {
      return `Joint or knee pain can greatly impact your physical mobility. Avoid placing excess load on the affected joint.

## Possible Reasons
Joint pain commonly arises from age-related wear-and-tear (osteoarthritis), high uric acid levels, lack of joint lubrication, or old injuries.

## What You Can Do
* Rest the affected joint and avoid climbing stairs or squatting.
* Apply a cold compress (ice pack) if there is swelling, or a warm compress for simple stiff joints.
* Wear highly cushioned, flat, and supportive shoes.
* Gently stretch the joint within pain-free limits.

## Doctor Suggestion
For chronic joint stiffness or painful knee issues, please consult an **Orthopedic Specialist** or a **Rheumatologist**.`;
    }
  }

  // 11. Eye Pain & Redness
  if (containsAll([["eye", "aankh", "आँख", "आंख", "visual"], ["pain", "dard", "drd", "red", "lal", "लाल", "allergy", "irritation", "सूजन", "दर्द"]])) {
    if (lang === "hi") {
      return `आँखों में दर्द या लाली होना बहुत संवेदनशील समस्या है। कृपया अपनी आँखों को कभी भी न रगड़ें।

## संभावित कारण
आँखों में दर्द, पानी आना या लाली स्क्रीन टाइम (computer/phone) अधिक होने से सूखापन (dry eyes), आई फ्लू (conjunctivitis) या धूल-मिट्टी से एलर्जी के कारण हो सकता है।

## आप क्या कर सकते हैं
* ठंडे साफ पानी के छीटें आँखों पर मारें, आँखों को रगड़ें (rub) बिल्कुल नहीं।
* मोबाइल, कंप्यूटर और टीवी स्क्रीन का इस्तेमाल तुरंत बंद करें।
* बाहर धूप या धूल में जाते समय काले चश्मे (sunglasses) का प्रयोग करें।
* यदि संभव हो, तो डॉक्टर की सलाह के बिना कोई भी आई ड्रॉप न डालें।

## डॉक्टर का सुझाव
आँखों के सटीक निदान के लिए तुरंत किसी **Ophthalmologist (नेत्र रोग विशेषज्ञ)** को दिखाएं।`;
    } else if (lang === "hinglish") {
      return `Aankh me dard, jalan ya redness kafi sensitive problem hoti hai. Aankho ko bilkul rub (rabadna) na karein.

## Possible Reasons
Eye pain ya redness zyada screen time se dry eyes hone, bacterial infection (conjunctivitis/eye flu) ya dust allergy ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Aankh ko thande aur saaf paani se halka dhoyein, par rub na karein.
* Abhi mobile/laptop screens dekhna turant band kar dein.
* Light room me aaram karein aur computer glasses ya sunglasses pehnein.
* Kisi bhi eye drop ka use bina doctor ke consult ke na karein.

## Doctor Suggestion
Iske treatment aur checkup ke liye ek qualified **Ophthalmologist (Aankh ke doctor)** se sampark karein.`;
    } else {
      return `Eye pain or redness is a highly sensitive clinical issue. Please do not rub your eyes under any circumstances.

## Possible Reasons
Eye discomfort, watering, or redness is commonly triggered by digital eye strain (excess screen time), dry eyes, conjunctivitis (pink eye), or dust/pollen allergies.

## What You Can Do
* Splash clean, cool water gently onto your eyes, but do not rub or scratch them.
* Take an absolute break from computers, mobile phones, and television screens.
* Wear dark sunglasses if you need to step outside to prevent light sensitivity.
* Keep your hands clean and avoid touching your face.

## Doctor Suggestion
Please consult an **Ophthalmologist (Eye Specialist)** immediately to avoid further complications.`;
    }
  }

  // 12. Ear Pain
  if (containsAll([["ear", "kaan", "कान"], ["pain", "dard", "drd", "earache", "infection", "दर्द"]])) {
    if (lang === "hi") {
      return `कान का दर्द बहुत असहज और तीव्र हो सकता है। कृपया कान के अंदर कोई भी नुकीली वस्तु या ईयरबड न डालें।

## संभावित कारण
कान में दर्द सर्दी-जुकाम के इन्फेक्शन के कान तक फैलने, कान में पानी चले जाने, वैक्स (ear wax) के जमा होने या फंगल संक्रमण के कारण हो सकता है।

## आप क्या कर सकते हैं
* कान को पूरी तरह सूखा रखें, नहाते समय कान में पानी न जाने दें।
* कान के अंदर माचिस की तीली, पिन या बड बिल्कुल न डालें, इससे कान के परदे को नुकसान हो सकता है।
* गर्म सिकाई के लिए कान के आस-पास (बाहर की तरफ) हल्के गर्म कपड़े से सेक लें।

## डॉक्टर का सुझाव
कान के इन्फेक्शन और दर्द के सटीक इलाज के लिए **ENT Specialist (नाक-कान-गला रोग विशेषज्ञ)** से परामर्श लें।`;
    } else if (lang === "hinglish") {
      return `Kaan me dard (earache) kafi irritating aur sharp hota hai. Kaan me koi bhi pin, earbud ya matchstick bilkul na daalein.

## Possible Reasons
Ear pain sardi-zukam ka infection kaan tak jaane, nahate waqt paani chale jaane ya excess earwax/infection ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Kaan ko dry rakhein aur pani se bacha kar rakhein.
* Ear buds ya sharp objects se kaan saaf karne ki koshish bilkul na karein.
* Kaan ke bahar ki side par warm compress (garam kapde ki sikai) kar sakte hain.

## Doctor Suggestion
Kaan ke proper checkup aur drops ke liye kisi **ENT Specialist** ko dikhayein.`;
    } else {
      return `An earache can be a sharp, throbbing, and highly uncomfortable experience. Never insert any sharp objects or cotton buds into your ear canal.

## Possible Reasons
Ear pain is typically caused by middle ear infections (often following a cold), water entry during swimming/bathing, accumulated earwax pressure, or fungal infections.

## What You Can Do
* Keep your ear completely dry and block it gently with dry cotton while bathing.
* Strictly avoid using cotton swabs, pins, or keys to clean your ear, as this can damage the eardrum.
* Apply a warm compress against the outer area of the ear to ease pain.

## Doctor Suggestion
Please consult an **ENT (Ear, Nose, Throat) Specialist** to check the status of your eardrum.`;
    }
  }

  // 13. Toothache
  if (containsAll([["tooth", "teeth", "dant", "daant", "दांत"], ["pain", "dard", "drd", "toothache", "दर्द"]])) {
    if (lang === "hi") {
      return `दांत का दर्द अत्यधिक तीव्र और परेशान करने वाला हो सकता है। मैं आपको कुछ समय के लिए राहत पाने के उपाय बताता हूँ।

## संभावित कारण
दांत में दर्द का मुख्य कारण कैविटी (कीड़ा लगना), मसूड़ों में सूजन, दांत का टूटना या अत्यधिक संवेदनशील दांत (sensitivity) हो सकता है।

## आप क्या कर सकते हैं
* गुनगुने पानी में थोड़ा नमक मिलाकर अच्छी तरह कुल्ला (rinse) करें।
* प्रभावित दांत के पास एक साबुत लौंग (clove) दबाएं या लौंग का तेल लगाएं।
* बहुत अधिक गर्म या ठंडी चीजें खाने-पीने से पूरी तरह बचें।
* दांतों को साफ रखें।

## डॉक्टर का सुझाव
दांतों की किसी भी समस्या के स्थाई समाधान के लिए तुरंत किसी **Dentist (दंत चिकित्सक)** से संपर्क करें।`;
    } else if (lang === "hinglish") {
      return `Dant me dard (toothache) kafi sharp aur uncomfortable hota hai. Aaiye iske reasons aur temporary aaram ke tarike dekhte hain.

## Possible Reasons
Toothache ka main reason teeth me cavity (sadan), gums (masudo) me swelling/infection ya excessive sensitivity ho sakta hai.

## Aap Kya Kar Sakte Hain
* Gungune namak wale paani se kulla karein, isse bacterial build-up kam hota hai.
* Aching tooth par clove oil (laung ka tel) lagayein ya ek laung daba kar rakhein.
* Zyada garam ya bohot thandi chizen khana band karein.

## Doctor Suggestion
Dant ki problem ke complete treatment ke liye ek qualified **Dentist** se consult karein.`;
    } else {
      return `A toothache can be an extremely sharp, localized, and radiating pain. Let's look at how to manage the discomfort temporarily.

## Possible Reasons
Toothaches are typically caused by deep dental cavities (decay), gum disease or abscess, tooth fractures, or severe tooth sensitivity.

## What You Can Do
* Swish and rinse your mouth with warm salt water to clean the area and reduce swelling.
* Place a dab of clove oil on a cotton bud and touch the affected tooth, or bite down on a whole clove.
* Avoid very hot, cold, sweet, or acidic foods.

## Doctor Suggestion
Please visit a **Dentist** as soon as possible for proper clinical diagnosis and permanent dental care.`;
    }
  }

  // 14. Stomach Pain & Discomfort
  if (containsAll([["stomach", "pet", "abdomen", "gastric", "belly", "पेट"], ["pain", "dard", "drd", "cramp", "gast", "gas", "दर्द", "खिंचाव"]])) {
    if (lang === "hi") {
      return `पेट में दर्द या तकलीफ होना बहुत असहज कर देता है। मैं आपको कुछ आसान घरेलू देखभाल के तरीके बताता हूँ।

## संभावित कारण
पेट दर्द, गैस, अपच (indigestion), एसिडिटी, बाहरी खाना खाने से इन्फेक्शन या मोशन (loose motion) की वजह से हो सकता है।

## आप क्या कर सकते हैं
* बिल्कुल हल्का और सादा खाना खाएं (जैसे मूंग दाल की खिचड़ी या केला)।
* तीखा, तला-भुना और बाहरी भोजन पूरी तरह से बंद कर दें।
* यदि लूज मोशन हैं, तो ओआरएस (ORS) का पानी या नींबू-नमक-चीनी का पानी पिएं।
* पर्याप्त आराम करें।

## डॉक्टर का सुझाव
यदि दर्द बहुत तेज है, तो **General Physician** या **Gastroenterologist (पेट रोग विशेषज्ञ)** को दिखाएं।`;
    } else if (lang === "hinglish") {
      return `Pet me dard ya digestion issue kafi uncomfortable hota hai. Pareshan na ho, aaiye iske reasons aur aaram ke tarike dekhte hain.

## Possible Reasons
Pet dard gas, indigestion, minor food infection, loose motion ya acidity ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Halka aur saada khana khayein (jaise khichdi ya dahi-chawal).
* Zyada se zyada paani aur ORS piyen taaki weakness na aaye.
* Oily, spicy aur junk food se door rahein.
* Rest karein aur pet par warm compress lagayein.

## Doctor Suggestion
Agar dard bahut zyada ho ya lagatar vomiting/loose motion rahe, to **General Physician** ya **Gastroenterologist** ko dikhaiye.`;
    } else {
      return `Experiencing stomach pain or digestive issues is extremely uncomfortable. Let's look at some gentle supportive measures.

## Possible Reasons
Stomach pain, gas, acidity, indigestion, or loose motions are often caused by food sensitivity, minor bacterial infections, or acidic imbalance.

## What You Can Do
* Stick to a bland, light diet (e.g., plain rice, bananas, oats, or khichdi).
* Drink plenty of water and oral rehydration solutions (ORS) to prevent dehydration.
* Avoid spicy, oily, fried, and outside processed foods.
* Rest and keep your body warm.

## Doctor Suggestion
If the pain is severe, prolonged, or accompanied by constant vomiting, please consult a **General Physician** or a **Gastroenterologist**.`;
    }
  }

  // 15. Cough & Cold
  if (containsAny(coughKeywords)) {
    if (lang === "hi") {
      return `मुझे दुख है कि आप खांसी या जुकाम से परेशान हैं। यह बहुत आम समस्या है।

## संभावित कारण
खांसी, जुकाम या गले में खराश श्वसन तंत्र में वायरल संक्रमण (viral infection), एलर्जी, धूल-धुआं या ठंडी चीजें खाने-पीने की वजह से हो सकता है।

## आप क्या कर सकते हैं
* गुनगुने पानी में थोड़ा नमक मिलाकर दिन में 2-3 बार गरारे (gargle) करें।
* गर्म पानी की भाप (steam) लें, उससे जकड़न में आराम मिलेगा।
* खूब सारा गुनगुना पानी या हर्बल अदरक-तुलसी की चाय पिएं।
* अत्यधिक ठंडी और खट्टी चीजों से परहेज करें।

## डॉक्टर का सुझाव
यदि खांसी और जुकाम 5-7 दिनों से अधिक समय तक बना रहे, तो किसी **General Physician** या **ENT Specialist** से सलाह लें।`;
    } else if (lang === "hinglish") {
      return `Khansi, sardi ya gala kharab hona kafi takleef deta hai. Aaiye iske simple reasons aur relief ke tarike dekhte hain.

## Possible Reasons
Ye problem mausam badalne (weather change), viral infection, dust allergy ya thanda pani/ice cream khane se ho sakti hai.

## Aap Kya Kar Sakte Hain
* Gungune paani me salt daal kar din me 2-3 baar gargle karein.
* Din me ek-do baar garm paani ki steam (bhaap) lein taaki chest aur nose clear rahe.
* Fridge ka thanda paani aur cold drinks bilkul band karein, gunguna pani piyen.
* Adrak-tulsi wali garam chai le sakte hain.

## Doctor Suggestion
Agar khansi 5-7 days me theek na ho ya saans phoolne lage, to ek **General Physician** ya **Pulmonologist** ko dikhayein.`;
    } else {
      return `Dealing with a cough, cold, or throat irritation can be highly fatiguing. Let's look at simple recovery steps.

## Possible Reasons
A cough, cold, or sore throat is commonly caused by seasonal viral upper-respiratory tract infections, airborne allergens, or environmental irritants.

## What You Can Do
* Gargle with warm salt water 2-3 times a day to soothe throat inflammation.
* Inhale warm steam to clear congestion in your nasal passage and chest.
* Hydrate frequently with warm fluids like water, herbal teas, or clear broths.
* Avoid ice cold beverages, smoking, and air pollutants.

## Doctor Suggestion
If the symptoms persist for more than 7 days, please consult a **General Physician** or an **ENT Specialist**.`;
    }
  }

  // 16. Weakness & Fatigue
  if (containsAny(weaknessKeywords)) {
    if (lang === "hi") {
      return `कमजोरी महसूस होना या चक्कर आना शरीर में थकान और पोषक तत्वों की कमी का संकेत है। कृपया तुरंत बैठ या लेट जाएं।

## संभावित कारण
थकान, चक्कर आना या कमजोरी शरीर में पानी की कमी (dehydration), ब्लड प्रेशर कम होने, नींद पूरी न होने या खून की कमी (anaemia) से हो सकती है।

## आप क्या कर सकते हैं
* तुरंत आरामदेह स्थिति में लेट जाएं ताकि चक्कर आने पर गिरने का खतरा न हो।
* एक गिलास पानी में ग्लूकोज या ओआरएस (ORS) घोलकर धीरे-धीरे पिएं।
* ताजे फल (जैसे केला या सेब) और पोषक भोजन खाएं।
* पर्याप्त आराम करें।

## डॉक्टर का सुझाव
यदि कमजोरी लंबे समय से बनी हुई है, तो कृपया **General Physician** को दिखाकर आवश्यक ब्लड टेस्ट (जैसे CBC, Iron) करवाएं।`;
    } else if (lang === "hinglish") {
      return `Kamzori, chakkar aana ya thakan body me low energy ya dehydration ka sign hai. Sabse pehle aaram karein.

## Possible Reasons
Ye problem dehydration (paani ki kami), blood pressure low hone, proper sleep na lene ya blood/vitamin deficiency ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Turant baith ya let jayein taaki chakkar aane par balance na khoye.
* Ek glass paani me glucose, nimbu-pani ya ORS daal kar piyen taaki instant energy mile.
* Fruits, green vegetables aur protein-rich diet lein.
* Kam se kam 7-8 ghante ki achhi aur gehri neend lein.

## Doctor Suggestion
Agar kamzori lagatar bani hui hai, to ek **General Physician** ko dikhakar normal blood count (CBC) test karwayein.`;
    } else {
      return `Feeling weak, fatigued, or lightheaded is a clear sign that your body needs to halt and replenish its energy.

## Possible Reasons
Fatigue, dizziness, or generalized weakness commonly arise from dehydration, low blood pressure, vitamin deficiencies, lack of sleep, or iron deficiency (anemia).

## What You Can Do
* Sit or lie down in a safe, quiet space immediately to prevent fainting.
* Drink an ORS solution, coconut water, or glucose water for fast hydration and energy.
* Eat a wholesome, light snack such as a banana or mixed nuts.
* Allow yourself at least 7-8 hours of sound sleep.

## Doctor Suggestion
If the fatigue is persistent and unexplained, consult a **General Physician** for routine evaluation and basic blood panels.`;
    }
  }

  // 17. Acidity & Gas
  if (containsAny(acidityKeywords)) {
    if (lang === "hi") {
      return `पेट या सीने में जलन और गैस की समस्या बहुत आम है। मैं आपको कुछ सरल उपाय बताता हूँ।

## संभावित कारण
एसिडिटी या गैस मसालेदार भोजन खाने, खाली पेट लंबे समय तक रहने, चाय-कॉफी का अत्यधिक सेवन करने या अपच (indigestion) के कारण होती है।

## आप क्या कर सकते हैं
* एक गिलास ठंडा दूध (बिना चीनी) पिएं, यह पेट की एसिडिटी को तुरंत शांत करता है।
* भोजन करने के तुरंत बाद लेटने से बचें, कम से कम 100 कदम टहलें।
* पर्याप्त पानी पिएं और मसालेदार, तला-भुना भोजन बंद करें।
* नारियल पानी या सौंफ का पानी पीना पेट के लिए बहुत फायदेमंद होता है।

## डॉक्टर का सुझाव
यदि जलन लगातार बनी रहे, तो **General Physician** या **Gastroenterologist** से संपर्क करें।`;
    } else if (lang === "hinglish") {
      return `Acidity aur gas ki pareshani kafi logo ko hoti hai. Aaiye isko control karne ke aasan tarike dekhte hain.

## Possible Reasons
Ye problem spicy food khane, empty stomach (bhuke pet) lambe samay tak rehne ya excess tea/coffee consumption ki wajah se ho sakti hai.

## Aap Kya Kar Sakte Hain
* Cold milk (thanda doodh bina sugar) piyen, ye acidity ko instantly neutralize karta hai.
* Khaana khane ke turant baad na soyein, thodi der walk karein.
* Nariyal paani ya saunf (fennel seeds) ka paani piyen.
* Coffee, smoking aur carbonated cold drinks band karein.

## Doctor Suggestion
Agar gas/acidity rozana pareshan kare, to checkup ke liye **General Physician** ko dikhayein.`;
    } else {
      return `Acidity, gas, and heartburn can cause significant discomfort in your chest and upper stomach.

## Possible Reasons
Acidity is typically triggered by eating oily or spicy foods, skipping meals, drinking too much caffeine (tea/coffee), or poor digestive habits.

## What You Can Do
* Sip a glass of cold milk (without sugar) for instant relief from acid reflux.
* Do not lie down immediately after meals; wait for at least 2 hours and take a light walk.
* Drink plenty of water throughout the day.
* Consume soothing drinks like coconut water or fennel (saunf) infused water.

## Doctor Suggestion
If the heartburn is frequent, severe, or mimics chest pressure, please consult a **General Physician** or a **Gastroenterologist**.`;
    }
  }

  // 18. Vomiting
  if (containsAny(vomitingKeywords)) {
    if (lang === "hi") {
      return `जी मिचलाना या उल्टी होना शरीर द्वारा किसी अवांछित भोजन को बाहर निकालने का प्रयास है। कृपया घबराएं नहीं।

## संभावित कारण
उल्टी (vomiting) होना फूड पॉइजनिंग (food poisoning), दूषित भोजन या पानी पीने, मोशन सिकनेस (यात्रा के दौरान), माइग्रेन या पेट में वायरल संक्रमण (stomach flu) के कारण हो सकता है।

## आप क्या कर सकते हैं
* उल्टी के तुरंत बाद भारी भोजन न करें, कुछ घंटों के लिए पेट को खाली और शांत रखें।
* शरीर में पानी और इलेक्ट्रोलाइट्स की कमी पूरी करने के लिए ओआरएस (ORS) घोल को चम्मच से धीरे-धीरे पिएं।
* मुंह के स्वाद के लिए थोड़ा अदरक का टुकड़ा या नींबू चूस सकते हैं।
* भारी, तला और तेज गंध वाला खाना बिल्कुल दूर रखें।

## डॉक्टर का सुझाव
यदि दिन में 3-4 बार से अधिक उल्टी हो या पानी भी न पच रहा हो, तो तुरंत **General Physician** से मिलकर एंटी-इमेटिक (anti-emetic) सलाह लें।`;
    } else if (lang === "hinglish") {
      return `Vomiting aur nausea (ji machalna) kafi weak feel karwa deta hai. Aaiye dehydration se bachne aur pet ko rest dene ke tarike dekhte hain.

## Possible Reasons
Vomiting food poisoning, bahar ka kharab khana/pani consume karne, stomach infection ya migration/travel sickness ki wajah se ho sakti hai.

## Aap Kya Kar Sakte Hain
* Vomit ke turant baad heavy khana na khayein. Pet ko aaram karne dein.
* Dehydration se bachne ke liye ORS, nimbu paani ya gunguna paani sip-sip karke piyen.
* Adrak (ginger) ka chota tukda chus sakte hain.

## Doctor Suggestion
Agar vomiting lagatar ho aur body me bilkul paani na tike, to delay kiye bina **General Physician** ko dikhayein.`;
    } else {
      return `Nausea and vomiting are symptoms indicating that your stomach is irritated or rejects something ingested.

## Possible Reasons
Vomiting is frequently caused by food poisoning, consuming contaminated water, stomach flu (viral gastroenteritis), motion sickness, or high acidity.

## What You Can Do
* Do not consume any solid food immediately after vomiting; let your stomach rest for a couple of hours.
* Sip Oral Rehydration Solution (ORS) or water slowly to prevent severe dehydration.
* Keep your environment well-ventilated and free of strong cooking odors.
* Suck on a small piece of ginger or a lemon drop to combat nausea.

## Doctor Suggestion
If you are unable to keep any liquids down for over 12 hours or experience severe dizziness, please consult a **General Physician** immediately.`;
    }
  }

  // 19. Loose Motions
  if (containsAny(looseMotionKeywords)) {
    if (lang === "hi") {
      return `दस्त (loose motions) होने पर शरीर में पानी और नमक की बहुत तेजी से कमी हो जाती है। शरीर को हाइड्रेटेड रखना सबसे महत्वपूर्ण है।

## संभावित कारण
दस्त लगना दूषित भोजन या जल पीने से आंतों में बैक्टीरिया या वायरल संक्रमण, अपच या ठंडे मौसम के प्रभाव के कारण हो सकता है।

## आप क्या कर सकते हैं
* ओआरएस (ORS) का घोल हर 1-2 घंटे में पिएं। यह शरीर में मिनरल्स और नमक की कमी को रोकता है।
* दही-चावल, केला, और उबला हुआ आलू जैसी आसानी से पचने वाली चीजें ही खाएं।
* दूध, पनीर, चाय-कॉफी और तली हुई चीजों का सेवन पूरी तरह से बंद कर दें।

## डॉक्टर का सुझाव
यदि दस्त में खून आ रहा हो, बहुत तेज बुखार हो या दस्त 2 दिन से अधिक समय तक रहे, तो बिना देरी किए **General Physician** को दिखाएं।`;
    } else if (lang === "hinglish") {
      return `Dast (loose motions) me body se paani aur minerals bohot tezi se kam hote hain. Hydration sabse zaroori hai.

## Possible Reasons
Loose motion contaminated food/water consume karne, stomach infection ya indigestion ki wajah se ho sakte hain.

## Aap Kya Kar Sakte Hain
* ORS (Oral Rehydration Solution) ka ghol har thodi der me piyen.
* Dahi-chawal (curd rice) aur kela (banana) khayein. Dahi digestion ko jaldi recover karta hai.
* Milk, cheese, sweet aur oily food abhi bilkul na lein.

## Doctor Suggestion
Agar dast 2 days se zyada rahe ya excessive weakness ho, to delay na karein aur **General Physician** se consult karein.`;
    } else {
      return `Experiencing loose motions (diarrhea) can quickly lead to exhaustion due to rapid loss of fluids and salts.

## Possible Reasons
Loose motions are usually caused by viral or bacterial intestinal infections (gastroenteritis), food intolerance, or consuming unsanitary water.

## What You Can Do
* Drink ORS (Oral Rehydration Solution) frequently to replace lost electrolytes.
* Eat plain, easy-to-digest foods such as bananas, curd-rice, applesauce, or oatmeal. Curd contains active probiotics that help soothe intestines.
* Completely avoid dairy products (milk, cheese), sugary items, coffee, and fried foods.

## Doctor Suggestion
If you notice blood in your stools, have a high fever, or if the symptoms persist for more than 48 hours, please consult a **General Physician**.`;
    }
  }

  // 20. Diabetes & Sugar
  if (containsAny(diabetesKeywords)) {
    if (lang === "hi") {
      return `मधुमेह (Diabetes/Sugar) को नियंत्रित रखने के लिए संतुलित जीवनशैली और नियमित दवाएं अत्यंत आवश्यक हैं।

## संभावित कारण
खून में ग्लूकोज (शुगर) का स्तर शरीर में इंसुलिन की कमी या इंसुलिन रेजिस्टेंस (insulin resistance) के कारण बढ़ता है। यह अनुवांशिक (genetic) या अस्वस्थ जीवनशैली से जुड़ा हो सकता है।

## आप क्या कर सकते हैं
* मीठी चीजें, सॉफ्ट ड्रिंक्स, आलू, मैदा और सफेद चावल खाने से परहेज करें।
* फाइबर युक्त भोजन जैसे हरी सब्जियां, साबुत अनाज और अंकुरित अनाज खाएं।
* हर दिन कम से कम 30-45 मिनट तेज गति से टहलें (brisk walk)।
* नियमित अंतराल पर अपना शुगर लेवल जांचें।

## डॉक्टर का सुझाव
डायबिटीज के प्रबंधन और दवाओं के सटीक निर्धारण के लिए किसी **Diabetologist (मधुमेह विशेषज्ञ)** या **Endocrinologist** से परामर्श लें।`;
    } else if (lang === "hinglish") {
      return `Sugar (diabetes) ko control me rakhna proper diet aur active life ke liye bohot zaroori hai.

## Possible Reasons
Blood sugar tab badhta hai jab body me insulin hormone sahi se kaam nahi karta. Ye unhealthy eating, lack of physical work ya genetics se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Sweets, white rice, maida, potatoes aur soft drinks ko avoid karein.
* High-fiber diet khayein jaise green vegetables, oats aur sprouts.
* Roz subah ya shaam kam se kam 30 mins tak brisk walk karein.
* Apni sugar levels ko ghar par regular monitor karein.

## Doctor Suggestion
Apni medicines ko custom adjust karwane ke liye ek expert **Diabetologist** ya **Endocrinologist** se consult karein.`;
    } else {
      return `Managing Diabetes (sugar levels) successfully requires a dedicated combination of dietary control, regular activity, and prescribed medication.

## Possible Reasons
Diabetes occurs when the body either does not produce enough insulin or cannot utilize it effectively, leading to elevated glucose levels in the bloodstream.

## What You Can Do
* Avoid refined sugars, carbonated soft drinks, white flour (maida), potatoes, and white rice.
* Focus on high-fiber foods such as green leafy vegetables, whole grains, pulses, and lean proteins.
* Commit to at least 30 minutes of daily physical exercise or brisk walking.
* Monitor your blood glucose levels regularly using a home glucometer.

## Doctor Suggestion
For personalized diabetes control and insulin/medication planning, please consult a **Diabetologist** or an **Endocrinologist**.`;
    }
  }

  // 21. Blood Pressure
  if (containsAny(bpKeywords)) {
    if (lang === "hi") {
      return `रक्तचाप (Blood Pressure) का अनियंत्रित होना दिल और मस्तिष्क के स्वास्थ्य के लिए संवेदनशील है।

## संभावित कारण
उच्च रक्तचाप (High BP) मानसिक तनाव, भोजन में अधिक नमक, गतिहीन जीवनशैली या अनुवांशिकता के कारण हो सकता है। निम्न रक्तचाप (Low BP) शरीर में पानी की कमी या पोषण की कमी से हो सकता है।

## आप क्या कर सकते हैं
* **High BP के लिए**: भोजन में नमक (sodium) की मात्रा तुरंत बहुत कम कर दें।
* **Low BP के लिए**: थोड़ा सा नमक और नींबू का पानी पिएं और पर्याप्त आराम करें।
* नियमित रूप से सुबह ताजी हवा में गहरी सांस लेने वाले प्राणायाम (deep breathing) करें।
* चाय, कॉफी, और धूम्रपान से पूरी तरह बचें।

## डॉक्टर का सुझाव
लगातार ब्लड प्रेशर की समस्या रहने पर **Cardiologist (हृदय रोग विशेषज्ञ)** या **General Physician** से सलाह लें।`;
    } else if (lang === "hinglish") {
      return `BP (blood pressure) high ya low hona health ke liye important concern hai. Kripya rest karein aur salt intake check karein.

## Possible Reasons
High BP stress, khane me zyada namak (salt) khane, physically active na rehne se ho sakta hai. Low BP thakan ya paani ki kami se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Apne khane me extra namak aur spicy oil lena turant band karein.
* ORS, ya halka namak-sugar ka pani piyen aur let jayein.
* Har roz 15-20 mins deep breathing (anulom-vilom) karein, stress kam karein.

## Doctor Suggestion
BP levels ko optimize karne ke liye ek **General Physician** ya **Cardiologist** se proper prescription lein.`;
    } else {
      return `Blood pressure imbalances require careful and continuous clinical monitoring to avoid cardiovascular strain.

## Possible Reasons
Hypertension (High BP) is often related to high sodium intake, excessive stress, lack of sleep, or weight gain. Hypotension (Low BP) can stem from severe dehydration or circulation anomalies.

## What You Can Do
* Limit your daily salt (sodium) intake immediately and avoid oily fast foods.
* Drink salted lemonade, ORS, or coconut water, and lie down comfortably.
* Dedicate 15 minutes daily to light yoga or deep breathing exercises to manage stress levels.
* Avoid smoking and limit alcohol/caffeine.

## Doctor Suggestion
Please consult a **General Physician** or a **Cardiologist** for regular blood pressure checkups and medication planning.`;
    }
  }

  // 22. Asthma & Breathlessness
  if (containsAny(asthmaKeywords)) {
    if (lang === "hi") {
      return `सांस फूलना या अस्थमा (Asthma) की समस्या अत्यंत गंभीर हो सकती है। कृपया शांत रहें और आरामदेह स्थिति में बैठें।

## संभावित कारण
सांस लेने में तकलीफ फेफड़ों की नली में सूजन, धूल-मिट्टी या पालतू जानवरों के बालों से एलर्जी, मौसम में अचानक बदलाव या अस्थमा के कारण हो सकती है।

## आप क्या कर सकते हैं
* सीधे बैठ जाएं (लेटने से बचें, क्योंकि सीधे बैठने से फेफड़ों को हवा लेने में आसानी होती है)।
* यदि आपके पास डॉक्टर द्वारा दिया गया इनहेलर (Inhaler) है, तो उसका उपयोग तुरंत करें।
* तंग कपड़ों को ढीला करें और खुली हवादार खिड़की के पास बैठें।
* धूल, धुएं और ठंडी हवा के संपर्क में आने से बचें।

## डॉक्टर का सुझाव
सांस की गंभीर तकलीफ होने पर तुरंत **Pulmonologist (फेफड़ा रोग विशेषज्ञ)** से संपर्क करें।`;
    } else if (lang === "hinglish") {
      return `Saans lene me takleef ya asthma attack kafi serious ho sakta hai. Kripya shant rahein aur straight baith jayein.

## Possible Reasons
Breathlessness lungs ki airways me swelling hone, dust/pollen allergy, seasonal cold ya asthma ki wajah se ho sakti hai.

## Aap Kya Kar Sakte Hain
* Hamesha straight baithein, letne se lungs par pressure padta hai.
* Agar aapke paas personal inhaler hai to uske puffs turant lein.
* Tight kapdo ko dheela karein aur fresh aur khuli hawa me saans lein.
* Smoke aur dust se bilkul door rahein.

## Doctor Suggestion
Saans phoolne ki problem ke liye bina delay kiye ek expert **Pulmonologist** se consult karein.`;
    } else {
      return `Difficulty breathing or an asthma flare-up requires immediate and careful supportive care. Please stay calm.

## Possible Reasons
Shortness of breath is commonly caused by narrowing and swelling of the lung airways, pollen/dust allergies, extreme cold, or asthma triggers.

## What You Can Do
* Sit upright immediately (do not lie flat, as sitting up helps open up the lungs).
* Use your doctor-prescribed rescue inhaler immediately if you have one.
* Loosen any tight clothing around your chest and neck.
* Stay in a dust-free, well-ventilated space.

## Doctor Suggestion
Please seek immediate care from a **Pulmonologist (Chest Specialist)**. If breathing becomes extremely shallow, visit the nearest emergency room.`;
    }
  }

  // 23. Injury
  if (containsAny(injuryKeywords)) {
    if (lang === "hi") {
      return `चोट लगने या घाव होने पर सबसे पहला कदम संक्रमण को रोकना और बहते खून को नियंत्रित करना है।

## संभावित कारण
चोट लगना किसी दुर्घटना, गिरने, कटने या भारी वस्तु से टकराने के कारण हो सकता है।

## आप क्या कर सकते हैं
* बहते खून को रोकने के लिए घाव पर एक साफ कपड़े या पट्टी से 5-10 मिनट तक हल्का दबाव बनाए रखें।
* घाव को साफ नल के पानी से धोएं ताकि धूल और गंदगी निकल जाए।
* संक्रमण से बचने के लिए घाव पर कोई एंटीसेप्टिक क्रीम (जैसे Betadine) लगाएं और साफ पट्टी बांधें।
* यदि हड्डी में फ्रैक्चर की आशंका हो, तो उस हिस्से को बिल्कुल न हिलाएं।

## डॉक्टर का सुझाव
गहरे घाव, अत्यधिक रक्तस्राव या गंभीर मोच/फ्रैक्चर के लिए तुरंत किसी **General Surgeon** या **Orthopedic Specialist** को दिखाएं।`;
    } else if (lang === "hinglish") {
      return `Chot lagne ya bleeding hone par sabse pehle infection se bachna aur blood loss rokna zaroori hai.

## Possible Reasons
Chot lagna accident, slip hone, kisi sharp object se cut lagne ya fracture ki wajah se ho sakta hai.

## Aap Kya Kar Sakte Hain
* Bleeding rokne ke liye clean cloth ya bandage se chot par 5 mins tak pressure banaye rakhein.
* Wound (घाव) ko running tap water se saaf dhoyein.
* Antiseptic cream lagayein aur bandage karein.
* Agar fracture lag raha ho, to us body part ko bilkul na hilayein.

## Doctor Suggestion
Deep cuts, excessive bleeding ya fracture ke liye turant **Orthopedic Specialist** ya **General Surgeon** ko dikhayein.`;
    } else {
      return `In case of minor injuries or cuts, the primary focus is preventing infection and stopping any active bleeding.

## Possible Reasons
Wounds and injuries typically occur from accidental falls, sharp cuts, direct physical impacts, or bone fractures.

## What You Can Do
* Apply direct, steady pressure on the bleeding area with a clean cloth or sterile bandage for 5 minutes.
* Wash the wound under running tap water to remove dirt and particles.
* Apply an antiseptic ointment (like Betadine) and cover it with a sterile dressing.
* Immobilize the area if a bone fracture is suspected.

## Doctor Suggestion
For deep wounds requiring stitches, continuous bleeding, or suspected fractures, please consult a **General Surgeon** or an **Orthopedic Specialist**.`;
    }
  }

  // 24. Anxiety & Stress
  if (containsAny(anxietyKeywords)) {
    if (lang === "hi") {
      return `घबराहट महसूस होना या अत्यधिक तनाव होना बहुत कष्टदायक हो सकता है। कृपया शांत रहने की कोशिश करें, मैं आपके साथ हूँ।

## संभावित कारण
घबराहट, पैनिक या तनाव काम के अत्यधिक बोझ, मानसिक दबाव, पर्याप्त नींद न मिलना या किसी बात की अत्यधिक चिंता के कारण हो सकता है।

## आप क्या कर सकते हैं
* **गहरी सांसें लें**: 4 सेकंड तक नाक से सांस लें, 4 सेकंड रोकें, और फिर 4 सेकंड में मुंह से बाहर छोड़ें (Box breathing)।
* एक गिलास सामान्य या हल्का ठंडा पानी पिएं।
* किसी अपने भरोसेमंद मित्र या परिवार के सदस्य से अपनी चिंता साझा करें।
* मोबाइल/कंप्यूटर की स्क्रीन बंद कर दें।

## डॉक्टर का सुझाव
यदि घबराहट और तनाव नियमित रूप से आपके दैनिक जीवन को प्रभावित करता है, तो कृपया **Psychiatrist (मनोचिकित्सक)** या **Clinical Psychologist** से परामर्श लें।`;
    } else if (lang === "hinglish") {
      return `Ghabrahat ya stress feel hona kafi tough hota hai. Pareshan na ho, aaiye man ko shant karne ke tarike dekhte hain.

## Possible Reasons
Anxiety ya tension workload, proper sleep na lene, overthinking ya temporary panic attack ki wajah se ho sakti hai.

## Aap Kya Kar Sakte Hain
* **Deep breathing karein**: Apni nose se deep saans lein, 4 seconds hold karein aur dhire se chodein.
* Halka thanda paani piyen.
* Mobile screen ko side me rakh kar kisi positive topic par focus karein.
* Apni ghabrahat kisi family member ya friend se share karein.

## Doctor Suggestion
Agar anxiety regular bani rahe, to ek competent **Psychiatrist** ya **Psychologist** se consult karein.`;
    } else {
      return `Feeling anxious or extremely stressed can be deeply overwhelming. Please stay calm, draw a deep breath, and let's address it.

## Possible Reasons
Anxiety, stress, or panic attacks are usually triggered by sleep deprivation, lifestyle pressures, or acute overthinking.

## What You Can Do
* **Practice Deep Breathing**: Inhale slowly through your nose for 4 seconds, hold for 4 seconds, and exhale slowly for 4 seconds.
* Sip a glass of cool water slowly.
* Step away from digital screens.

## Doctor Suggestion
If chronic anxiety, palpitations, or stress disrupt your routine, please consult a licensed **Psychiatrist** or a **Clinical Psychologist**.`;
    }
  }

  // 25. General Greetings (Hi, Hello, Namaste, Hey)
  if (containsAny(greetingWords)) {
    if (lang === "hi") {
      return `नमस्ते 👋
मैं Clinoza AI हूँ, आपका समर्पित हेल्थकेयर सहायक। मैं आपकी मदद के लिए सदैव यहाँ उपलब्ध हूँ।

मैं आपकी सहायता कर सकता हूँ:
• **लक्षणों के आधार पर सही डॉक्टर का सुझाव देने में**
• **स्वास्थ्य समस्याओं को आसान शब्दों में समझने में**
• **प्राथमिक स्वास्थ्य सलाह प्रदान करने में**

**आप आज कैसा महसूस कर रहे हैं?** कृपया अपनी स्वास्थ्य संबंधी समस्या या लक्षणों (जैसे बुखार, सिरदर्द, खांसी आदि) के बारे में बताएं। मैं तुरंत उसका समाधान आसान शब्दों में दूंगा।`;
    } else if (lang === "hinglish") {
      return `Namaste 👋
Main Clinoza AI hoon, aapka smart aur supportive healthcare assistant. Main aapki help ke liye hamesha yahan hoon.

Main aapko:
• **Doctor Suggestions**: Symptoms ke basis par kaun se specialist se milein
• **Basic Healthcare Guidance**: Simple aur easy-to-understand health advice
• **Hospital Recommendations**

dene me help karunga. 

**Aap aaj kaisa feel kar rahe hain?** Kripya apne symptoms (jaise bukhar, sir dard, khansi, stomach pain etc.) batayein taaki main help kar sakoon!`;
    } else {
      return `Hello 👋
I am Clinoza AI, your dedicated and caring healthcare assistant. I am here to support you in every way possible.

I can assist you with:
• **Specialist Doctor Suggestions** based on your symptoms
• **Simple, Easy-to-Understand Explanations** of health issues
• **Basic Healthcare Guidance & Self-Care Tips**

**How are you feeling today?** Please describe your symptoms or share your health concerns so I can assist you immediately!`;
    }
  }

  // 26. Smart Catch-All Conversational Dynamic Prompt
  if (lang === "hi") {
    return `मैं समझ रहा हूँ कि आप अपनी सेहत से जुड़ी किसी बात को लेकर चिंतित हैं। आपकी बात के अनुसार मैं आपकी पूरी मदद करूँगा।

कृपया मुझे अपने लक्षणों या शारीरिक परेशानी (जैसे सिरदर्द, बुखार, खांसी, त्वचा की समस्या, पीठ में दर्द आदि) के बारे में थोड़ा और विस्तार से बताएं। इससे मुझे आपकी स्थिति को समझने और आपको सही **डॉक्टर का सुझाव** देने में आसानी होगी।`;
  } else if (lang === "hinglish") {
    return `Aapne jo baat share ki hai, main use samajh raha hoon. Aapki concern ke according main aapki help karne ke liye taiyar hoon.

Kripya mujhe apne symptoms ya health issue (jaise sir dard, bukhar, khansi, stomach pain ya back pain) ke baare me thoda detail me batayein. Isse main aapki problem ko simple way me explain kar ke sahi **doctor type ka suggestion** de sakunga.`;
  } else {
    return `I understand what you have shared and I am here to support you regarding your health concern. 

To help me explain your problem in the easiest possible way, could you please tell me a bit more about your exact symptoms (such as headache, fever, cough, joint pain, or back pain)? This will allow me to provide targeted self-care tips and suggest the right **doctor type** for you.`;
  }
}

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { message, sessionId, history } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, msg: "Message is required" });
    }

    let aiResponseText = "";
    
    // Attempt to use OpenAI if configured
    if (openai) {
      try {
        const systemPrompt = `You are Clinoza AI, a modern and intelligent healthcare assistant powered by OpenAI for the Clinoza platform.

Your goal is to communicate naturally like ChatGPT/Gemini and understand the user's message deeply instead of relying on simple keyword matching.

Your personality:
- Professional, Calm, Highly Helpful, Human-like, Supportive.
- Talk naturally like ChatGPT/Gemini.
- Never write welcome messages repeatedly in the middle of a chat session.
- Empathize with and understand the user's emotions, pain, and concerns. Speak like a real, caring doctor.
- Respond intelligently even if the user writes casually, incorrectly, shortly, emotionally, or in mixed language.
- If the user has already explained their problem, directly help them and address it instead of asking them to repeat it.

AUTOMATIC LANGUAGE MATCHING (CRITICAL):
- Automatically detect the user's language and writing script (Hindi Devanagari, Hinglish Roman, or mixed Hindi-English sentences).
- You MUST reply in the EXACT SAME language and writing style used by the user's message naturally.
- If the user writes in Devanagari Hindi (e.g. "मुझे बुखार है"), reply in pure Devanagari Hindi.
- If the user writes in English, reply in English.
- If the user writes in Hinglish (Roman script Hindi, e.g. "mujhe bukhar hai"), reply in natural Hinglish.
- Smoothly understand spelling mistakes, short forms, casual language, and mixed Hindi-English sentences. Automatically detect what the user actually meant to write and reply strictly based on that.

IMPORTANT RESPONSE STYLE (LIKE CHATGPT):
- Respond naturally like ChatGPT.
- Use structured markdown formatting with these exact, standard headers when explaining a health issue:
  * In Hinglish:
    ## Possible Reasons
    [Briefly and simply explain potential non-scary causes here]
    
    ## Aap Kya Kar Sakte Hain
    * [Provide simple, clear, actionable supportive home-care tips in bullets]
    
    ## Doctor Suggestion
    [Clearly state which doctor specialist to see (e.g., General Physician, Dermatologist, Gastroenterologist). Never prescribe medicine. Always advise consulting a real doctor.]
  * In Devanagari Hindi:
    ## संभावित कारण
    [यहाँ पर आसान शब्दों में संभावित कारण स्पष्ट करें]
    
    ## आप क्या कर सकते हैं
    * [आसान शब्दों में प्राथमिक सहायता सलाह और बुलेट पॉइंट दें]
    
    ## डॉक्टर का सुझाव
    [स्पष्ट शब्दों में बताएं कि किस विशेषज्ञ डॉक्टर से संपर्क करें]
  * In English:
    ## Possible Reasons
    [Briefly and simply explain potential non-scary causes here]
    
    ## What You Can Do
    * [Provide simple, clear, actionable supportive home-care tips in bullets]
    
    ## Doctor Suggestion
    [Clearly state which doctor specialist to see. Always recommend consulting a real doctor.]

HOSPITAL RECOMMENDATION RULE:
- Suggest specific hospitals ONLY when the user explicitly asks for them. Do not proactively include hospital recommendations or availability warnings in generic symptom questions.
- If the user explicitly asks for hospitals, and no hospital data is available, you MUST include this exact sentence politely based on the language context:
  * In Hinglish: "Abhi is area ke hospitals platform par available nahi hain."
  * In Devanagari Hindi: "अभी इस एरिया के अस्पताल प्लेटफ़ॉर्म पर उपलब्ध नहीं हैं।"
  * In English: "Currently, hospitals for this area are not available on the platform."

SAFETY BOUNDARIES (CRITICAL):
- Never give final diagnoses or prescribe medications.
- Never guarantee treatments.
- Never scare the user. Keep a reassuring, supportive tone.
- If severe symptoms (e.g., severe chest pain, extreme breathing difficulty, stroke symptoms, unconsciousness, heavy bleeding, severe injury) are mentioned, advise immediate hospital consultation or emergency care calmly.`;

        // Format history for chat completion API if present
        const messages = [
          { role: "system", content: systemPrompt }
        ];

        if (history && Array.isArray(history)) {
          history.forEach(item => {
            if (item.sender === "user") {
              messages.push({ role: "user", content: item.text });
            } else if (item.sender === "ai") {
              messages.push({ role: "assistant", content: item.text });
            }
          });
        }

        // Add current message
        messages.push({ role: "user", content: message });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // fast and economical
          messages: messages,
          max_tokens: 600,
          temperature: 0.7,
        });

        if (completion.choices && completion.choices[0] && completion.choices[0].message) {
          aiResponseText = completion.choices[0].message.content;
        } else {
          throw new Error("No response content from OpenAI");
        }
      } catch (err) {
        console.warn("OpenAI API call failed. Using expert fallback engine. Error:", err.message);
        aiResponseText = getFallbackResponse(message);
      }
    } else {
      // API Key is not set or placeholder; use local fallback engine
      aiResponseText = getFallbackResponse(message);
    }

    // Save chat interaction to MongoDB
    const chatLog = new AIChat({
      sessionId: sessionId || "global",
      userMessage: message,
      aiResponse: aiResponseText,
    });
    await chatLog.save();

    res.status(200).json({
      success: true,
      reply: aiResponseText,
      chatId: chatLog._id,
    });

  } catch (error) {
    console.error("AI Chat Route Error:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to process chat request",
      error: error.message
    });
  }
});

// GET /api/chat/history (Optional helper for frontend to fetch recent history)
router.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await AIChat.find({ sessionId }).sort({ createdAt: 1 }).limit(50);
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch chat history", error: error.message });
  }
});

module.exports = router;
