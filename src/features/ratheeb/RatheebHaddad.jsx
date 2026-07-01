import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import { usePrayerStreak } from '../../PrayerStreakContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import './RatheebHaddad.css';

// 26 Authentic Sections of Ratheeb al-Haddad with precise start and end audio timings (in seconds)
const RATHEEB_SECTIONS = [
    {
        id: 1,
        title_en: "Surah Al-Fatihah",
        title_ml: "സൂറത്തുൽ ഫാത്തിഹ",
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۞ الرَّحْمَٰنِ الرَّحِيمِ ۞ مَالِكِ يَوْمِ الدِّينِ ۞ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۞ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۞ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
        transliteration: "Bismillahir Rahmanir Rahim. Alhamdu lillahi Rabbil 'alamin. Ar-Rahmanir Rahim. Maliki yawmid-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinas-siratal-mustaqim. Siratal-lathina an'amta 'alayhim, ghayril-maghdwubi 'alayhim waladh-dhallin. (Amin)",
        english: "In the name of Allah, the Beneficent, the Merciful. Praise be to Allah, Lord of the Worlds. The Beneficent, the Merciful. Owner of the Day of Judgment. Thee alone we worship and Thee alone we ask for help. Guide us on the straight path. The path of those whom Thou hast favored, not of those who earn Thine anger nor of those who go astray. (Amen)",
        malayalam: "പരമകാരുണികനും കരുണാനിധിയുമായ അല്ലാഹുവിന്റെ നാമത്തിൽ. സർവ്വലോക രക്ഷിതാവായ അല്ലാഹുവിന്നാണ് എല്ലാ സ്തുതിയും. അവൻ പരമകാരുണികനും കരുണാനിധിയുമത്രെ. പ്രതിഫല ദിവസത്തിന്റെ ഉടമസ്ഥൻ. നിന്നെ മാത്രം ഞങ്ങൾ ആരാധിക്കുന്നു, നിന്നോട് മാത്രം ഞങ്ങൾ സഹായം തേടുന്നു. ഞങ്ങളെ നീ നേർവഴിയിലാക്കേണമേ. നീ അനുഗ്രഹിച്ചവരുടെ വഴിയിൽ; കോപത്തിന്നിരയായവരുടെയോ വഴിപിഴച്ചവരുടെയോ വഴിയിലല്ല. (ആമീൻ)",
        repeat: 1,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 0,
        endTime: 35
    },
    {
        id: 2,
        title_en: "Ayatul Kursi (Surah Al-Baqarah 255)",
        title_ml: "ആയത്തുൽ കുർസി",
        arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّن 'ِعلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        transliteration: "Allahu la ilaha illa Huwal-Hayyul-Qayyum. La ta'khuthuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ardh. Man thallathi yashfa'u 'indahu illa bi-ithnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhitwna bi-shay'im-min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ardh, wa la ya'uduhu hifthuhuma, wa Huwal-'Aliyyul-'Athim.",
        english: "Allah! There is no deity but Him, the Ever-Living, the Self-Sustaining. Slumber seizes Him not, nor sleep. To Him belongs whatsoever is in the heavens and whatsoever is in the earth. Who is he that can intercede with Him but by His permission? He knows that which is before them and that which is behind them, and they encompass nothing of His knowledge save what He wills. His Kursi extends over the heavens and the earth, and He is never weary of preserving them. He is the Most High, the Supreme.",
        malayalam: "അല്ലാഹു! അവനല്ലാതെ യാതൊരു ദൈവവുമില്ല. ജീവനുള്ളവനും എല്ലാറ്റിനെയും നിയന്ത്രിക്കുന്നവനുമാണ് അവൻ. മയക്കമോ ഉറക്കമോ അവനെ ബാധിക്കുകയില്ല. ഭൂമിയിലും ആകാശങ്ങളിലുമുള്ളതെല്ലാം അവന്റേതാണ്. അവന്റെ അനുവാദപ്രകാരമല്ലാതെ അവന്റെയടുക്കൽ ശുപാർശ ചെയ്യാൻ കഴിയുന്നവൻ ആരാണ്? അവരുടെ മുൻപിലുള്ളതും പുറകിലുള്ളതുമെല്ലാം അവൻ അറിയുന്നു. അവന്റെ അറിവിൽ നിന്നും അവൻ ഉദ്ദേശിക്കുന്നതല്ലാതെ യാതൊന്നും അവർക്ക് ലഭിക്കുകയില്ല. അവന്റെ സിംഹാസനം ആകാശഭൂമികളെയെല്ലാം ഉൾക്കൊള്ളുന്നതാകുന്നു. അവയുടെ സംരക്ഷണം അവന് ഒട്ടും ഭാരമുള്ളതല്ല. അവൻ ഉന്നതനും മഹാനുമത്രെ.",
        repeat: 1,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 35,
        endTime: 82
    },
    {
        id: 3,
        title_en: "Surah Al-Baqarah (285-286)",
        title_ml: "ആമനർറസൂൽ (അൽ ബഖറ 285-286)",
        arabic: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ۞ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاഖِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
        transliteration: "Amanar-Rasulu bima unzila ilayhi mir-Rabbihi wal-mu'minun. Kullun amana billahi wa mala'ikatihi wa kutubihi wa rusulih. La nufarriqu bayna ahadim-mir-rusulih. Wa qalu sami'na wa ata'na, ghufranaka Rabbana wa ilaykal-masir. La yukallifullahu nafsan illa wus'aha, laha ma kasabat wa 'alayha maktasabat. Rabbana la tu'akhithna in-nasina aw akhta'na. Rabbana wa la tahmil 'alayna isran kama hamaltahu 'alal-lathina min qablina. Rabbana wa la tuhammilna ma la taqata lana bih. Wa'fu 'anna, waghfir lana, warhamna. Anta Mawlana fansurna 'alal-qawmil-kafirin.",
        english: "The Messenger has believed in what was revealed to him from his Lord, and so have the believers. All of them have believed in Allah and His angels and His books and His messengers, [saying], 'We make no distinction between any of His messengers.' And they say, 'We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination.' Allah does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. 'Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.'",
        malayalam: "തന്റെ രക്ഷിതാവിങ്കൽ നിന്ന് തനിക്ക് അവതരിപ്പിക്കപ്പെട്ടതിൽ റസൂൽ വിശ്വസിച്ചിരിക്കുന്നു; സത്യവിശ്വാസികളും. എല്ലാവരും അല്ലാഹുവിലും അവന്റെ മലക്കുകളിലും ഗ്രന്ഥങ്ങളിലും ദൂതന്മാരിലും വിശ്വസിച്ചിരിക്കുന്നു. 'അവന്റെ ദൂതന്മാരിൽ ആർക്കുമിടയിൽ ഞങ്ങൾ വേർതിരിവ് കാണിക്കുന്നില്ല' എന്ന് അവർ പറയുന്നു. അവർ പറയുകയും ചെയ്തു: 'ഞങ്ങൾ കേൾക്കുകയും അനുസരിക്കുകയും ചെയ്തിരിക്കുന്നു. ഞങ്ങളുടെ രക്ഷിതാവേ, നിന്റെ പാപമോചനം ഞങ്ങൾ തേടുന്നു, നിന്നിലേക്കാണ് ഞങ്ങളുടെ മടക്കം.' ഒരാളോടും അല്ലാഹു അവന്റെ കഴിവിനപ്പുറമുള്ളത് ചെയ്യാൻ നിർബന്ധിക്കുകയില്ല. അവൻ പ്രവർത്തിച്ച നന്മ അവന്നുള്ളതാണ്; അവൻ ചെയ്തുപോയ തിന്മ അവൻ ചുമക്കേണ്ടതുമാണ്. 'ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾ മറന്നുപോവുകയോ തെറ്റുപറ്റുകയോ ചെയ്തിട്ടുണ്ടെങ്കിൽ ഞങ്ങളെ നീ ശിക്ഷിക്കരുതേ. ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾക്ക് മുൻപുള്ളവരുടെ മേൽ നീ ചുമത്തിയതുപോലുള്ള ഭാരിച്ച ബാധ്യത ഞങ്ങളുടെ മേൽ നീ ചുമത്തരുതേ. ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾക്ക് താങ്ങാൻ കഴിയാത്തത് ഞങ്ങളെ നീ ചുമത്തരുതേ. ഞങ്ങൾക്ക് നീ മാപ്പുനൽകുകയും പൊറുത്തുതരികയും കാരുണ്യം ചൊരിയുകയും ചെയ്യേണമേ. നീയാണ് ഞങ്ങളുടെ രക്ഷാധികാരി. അതിനാൽ അവിശ്വാസികളായ ജനതയ്ക്കെതിരായി ഞങ്ങളെ നീ സഹായിക്കേണമേ.'",
        repeat: 1,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 82,
        endTime: 155
    },
    {
        id: 4,
        title_en: "Declaration of Tawheed (Unity of Allah)",
        title_ml: "തൗഹീദ് പ്രഖ്യാപനം",
        arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "La ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu, yuhyi wa yumitu, wa Huwa 'ala kulli shay'in Qadir.",
        english: "There is no deity but Allah alone, who has no partner. To Him belongs dominion, and to Him belongs praise. He gives life and causes death, and He is over all things Powerful.",
        malayalam: "അല്ലാഹുവല്ലാതെ മറ്റൊരു ദൈവവുമില്ല. അവൻ ഏകനാണ്, അവന് യാതൊരു പങ്കുകാരനുമില്ല. അവന്നാണ് സർവ്വ ആധിപത്യവും സ്തുതിയും. അവൻ ജീവിപ്പിക്കുകയും മരിപ്പിക്കുകയും ചെയ്യുന്നു. അവൻ എല്ലാ കാര്യങ്ങൾക്കും കഴിവുള്ളവനാകുന്നു.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 155,
        endTime: 195
    },
    {
        id: 5,
        title_en: "Tasbih & Tahmeed (Glorifying Allah)",
        title_ml: "തസ്ബീഹും തഹ്മീദും",
        arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ",
        transliteration: "Subhanallahi, wal-hamdu lillahi, wa la ilaha illallahu, wallahu Akbar.",
        english: "Glory be to Allah, praise be to Allah, there is no deity but Allah, and Allah is Most Great.",
        malayalam: "അല്ലാഹു എത്ര പരിശുദ്ധൻ, അല്ലാഹുവിന്നാണ് സർവ്വ സ്തുതിയും, അല്ലാഹുവല്ലാതെ മറ്റൊരു ദൈവവുമില്ല, അല്ലാഹു ഏറ്റവും വലിയവനാകുന്നു.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 195,
        endTime: 220
    },
    {
        id: 6,
        title_en: "Tasbih al-Atheem (Glorifying with Praise)",
        title_ml: "സുബ്ഹാനല്ലാഹി വബിഹംദിഹി",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
        transliteration: "Subhanallahi wa bihamdihi, Subhanallahil-'Athim.",
        english: "Glory be to Allah with His praise, Glory be to Allah the Almighty.",
        malayalam: "അല്ലാഹുവെ സ്തുതിക്കുന്നതോടൊപ്പം അവന് പരിശുദ്ധി വാഴ്ത്തുന്നു, അത്യുന്നതനായ അല്ലാഹു എത്രയോ പരിശുദ്ധൻ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 220,
        endTime: 242
    },
    {
        id: 7,
        title_en: "Seeking Forgiveness (Istighfar)",
        title_ml: "പാപമോചനം തേടൽ",
        arabic: "رَبَّنَا اغْفِرْ لَنَا وَتُبْ عَلَيْنَا، إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
        transliteration: "Rabbanagh-fir lana wa tub 'alayna, innaka Antat-Tawwabur-Rahim.",
        english: "Our Lord, forgive us and accept our repentance; indeed, You are the Accepting of repentance, the Merciful.",
        malayalam: "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾക്ക് പൊറുത്തു തരികയും ഞങ്ങളുടെ പശ്ചാത്താപം സ്വീകരിക്കുകയും ചെയ്യേണമേ. തീർച്ചയായും നീ പശ്ചാത്താപം ഏറെ സ്വീകരിക്കുന്നവനും കരുണാനിധിയുമത്രെ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 242,
        endTime: 265
    },
    {
        id: 8,
        title_en: "Salawat on Prophet Muhammad (S.A.W)",
        title_ml: "സ്വലാത്ത്",
        arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ، اللَّهُمَّ صَلِّ عَلَيْهِ وَسَلِّمْ",
        transliteration: "Allahumma salli 'ala Muhammad, Allahumma salli 'alayhi wa sallim.",
        english: "O Allah, bestow blessings upon Muhammad; O Allah, bestow blessings upon him and grant him peace.",
        malayalam: "അല്ലാഹുവേ, മുഹമ്മദ് നബിയുടെ മേൽ നീ അനുഗ്രഹം വർഷിക്കേണമേ. അല്ലാഹുവേ, അദ്ദേഹത്തിന് സമാധാനവും ശാന്തിയും നൽകേണമേ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 265,
        endTime: 288
    },
    {
        id: 9,
        title_en: "Refuge in Allah's Perfect Words",
        title_ml: "സംരക്ഷണം തേടൽ",
        arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        transliteration: "A'uthu bi-kalimatillahit-tammati min sharri ma khalaq.",
        english: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        malayalam: "അല്ലാഹു സൃഷ്ടിച്ചിട്ടുള്ള സർവ്വ തിന്മകളിൽ നിന്നും അവന്റെ സമ്പൂർണ്ണമായ വചനങ്ങളാൽ ഞാൻ അഭയം തേടുന്നു.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 288,
        endTime: 310
    },
    {
        id: 10,
        title_en: "Protection in Allah's Name",
        title_ml: "അല്ലാഹുവിന്റെ നാമത്തിൽ സംരക്ഷണം",
        arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        transliteration: "Bismillahillathi la yadhurru ma'as-mihi shay'un fil-ardhi wa la fis-sama'i wa Huwas-Sami'ul-'Alim.",
        english: "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
        malayalam: "ഭൂമിയിലോ ആകാശത്തോ ഉള്ള യാതൊരു വസ്തുവും ഉപദ്രവിക്കുകയില്ലാത്ത അല്ലാഹുവിന്റെ നാമത്തിൽ ആരംഭിക്കുന്നു; അവനോടൊപ്പം സർവ്വവും സുരക്ഷിതമാണ്. അവൻ എല്ലാം കേൾക്കുന്നവനും അറിയുന്നവനുമാകുന്നു.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 310,
        endTime: 338
    },
    {
        id: 11,
        title_en: "Pleased with Allah, Islam & Prophet",
        title_ml: "തൃപ്തി പ്രഖ്യാപിക്കൽ",
        arabic: "رَضِينَا بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ نَبِيًّا",
        transliteration: "Radhina billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin Nabiyya.",
        english: "We are pleased with Allah as Lord, with Islam as religion, and with Muhammad as Prophet.",
        malayalam: "അല്ലാഹുവിനെ ഞങ്ങളുടെ രക്ഷിതാവായും, ഇസ്ലാമിനെ ഞങ്ങളുടെ മതമായും, മുഹമ്മദ് നബിയെ ഞങ്ങളുടെ പ്രവാചകനായും ഞങ്ങൾ പൂർണ്ണമായി തൃപ്തിപ്പെട്ടിരിക്കുന്നു.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 338,
        endTime: 362
    },
    {
        id: 12,
        title_en: "Praise is for Allah & All is by His Will",
        title_ml: "സ്തുതിയും ഇച്ഛാശക്തിയും",
        arabic: "بِسْمِ اللَّهِ وَالْحَمْدُ لِلَّهِ، وَالْخَيْرُ وَالشَّرُّ بِمَشِيئَةِ اللَّهِ",
        transliteration: "Bismillahi wal-hamdu lillahi, wal-khayru wash-sharru bi-mashi'atillah.",
        english: "In the name of Allah and praise be to Allah, and all good and evil is by the will of Allah.",
        malayalam: "അല്ലാഹുവിന്റെ നാമത്തിൽ ആരംഭിക്കുന്നു, അവന്നാണ് സർവ്വ സ്തുതിയും. സർവ്വ നന്മകളും തിന്മകളും അല്ലാഹുവിന്റെ പവിത്രമായ ഉദ്ദേശ്യപ്രകാരം മാത്രമാണ് ഉണ്ടാകുന്നത്.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 362,
        endTime: 385
    },
    {
        id: 13,
        title_en: "Belief in Allah and Repentance",
        title_ml: "വിשותാസവും പശ്ചാത്താപവും",
        arabic: "آمَنَّا بِاللَّهِ وَالْيَوْمِ الْآخِرِ، تُبْنَا إِلَى اللَّهِ بَاطِنًا وَظَاهِرًا",
        transliteration: "Amanna billahi wal-yawmil-akhiri, tubna ilallahi batinan wa thahira.",
        english: "We believe in Allah and the Last Day; we turn to Allah in repentance, inwardly and outwardly.",
        malayalam: "ഞങ്ങൾ അല്ലാഹുവിലും പരലോകത്തിലും വിശ്വസിച്ചിരിക്കുന്നു. രഹസ്യമായും പരസ്യമായും ഞങ്ങൾ അല്ലാഹുവിലേക്ക് പശ്ചാത്തപിച്ചു മടങ്ങുന്നു.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 385,
        endTime: 410
    },
    {
        id: 14,
        title_en: "Pardon & Erasing of Sins",
        title_ml: "പാപമാപ്പ് നൽകൽ",
        arabic: "يَا رَبَّنَا وَاعْفُ عَنَّا، وَامْحُ الَّذِي كَانَ مِنَّا",
        transliteration: "Ya Rabbana wa'fu 'anna, wamhu-llathi kana minna.",
        english: "O our Lord, pardon us and wipe away whatever sins we have committed.",
        malayalam: "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾക്ക് മാപ്പുതരികയും ഞങ്ങളിൽ നിന്ന് സംഭവിച്ചുപോയ സർവ്വ തെറ്റുകൾ മായ്ച്ചു കളയുകയും ചെയ്യേണമേ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 410,
        endTime: 432
    },
    {
        id: 15,
        title_en: "O Possessor of Majesty and Bounty",
        title_ml: "പ്രതാപവും ആദരവുമുള്ളവനേ",
        arabic: "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ، أَمِتْنَا عَلَىٰ دِينِ الْإِسْلَامِ",
        transliteration: "Ya Thal-Jalali wal-Ikram, amitna 'ala dinil-Islam.",
        english: "O Possessor of Majesty and Bounty, cause us to die in the religion of Islam.",
        malayalam: "പരമപ്രതാപശാലിയും ആദരണീയനുമായ തമ്പുരാനേ, ഇസ്ലാം മാർഗ്ഗത്തിൽ ഞങ്ങളെ മരിപ്പിക്കേണമേ.",
        repeat: 7,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 432,
        endTime: 478
    },
    {
        id: 16,
        title_en: "O Mighty, O Strong One",
        title_ml: "ശക്തനായ ദൈവമേ",
        arabic: "يَا قَوِيُّ يَا مَتِينُ، اكْفِ شَرَّ الظَّالِمِينَ",
        transliteration: "Ya Qawiyyu ya Matinu, ikfi sharra-thahlimin.",
        english: "O Mighty One, O All-Powerful One, protect us from the evil of the oppressors.",
        malayalam: "അതിശക്തനും സർവ്വശക്തനുമായവനേ, അക്രമികളായ ശത്രുക്കളുടെ ദ്രോഹങ്ങളിൽ നിന്ന് ഞങ്ങൾക്ക് നീ സംരക്ഷണം നൽകേണമേ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 478,
        endTime: 502
    },
    {
        id: 17,
        title_en: "Improvement of Muslims' Affairs",
        title_ml: "മുസ്ലിംകളുടെ നന്മക്കായി",
        arabic: "أصْلَحَ اللَّهُ أُمُورَ الْمُسْلِمِينَ، صَرَفَ اللَّهُ شَرَّ الْمُؤْذِينَ",
        transliteration: "Aslahallahu umural-Muslimina, sarafallahu sharral-mu'thin.",
        english: "May Allah improve the affairs of the Muslims, and may Allah ward off the evil of those who cause harm.",
        malayalam: "അല്ലാഹു മുസ്ലിംകളുടെ കാര്യങ്ങളെല്ലാം ശരിയാക്കി നന്നാക്കിത്തരികയും ദ്രോഹം ചെയ്യുന്ന ശല്യക്കാരുടെ സർവ്വ ദോഷങ്ങളെയും തിരിച്ചുവിട്ട് സംരക്ഷിക്കുകയും ചെയ്യട്ടെ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 502,
        endTime: 525
    },
    {
        id: 18,
        title_en: "O Most High, O Great One",
        title_ml: "മഹോന്നതനായ തമ്പുരാനേ",
        arabic: "يَا عَلِيُّ يَا كَبِيرُ، يَا عَلِيمُ يَا قَدِيرُ، يَا سَمِيعُ يَا بَصِيرُ، يَا لَطِيفُ يَا خَبِيرُ",
        transliteration: "Ya 'Aliyyu ya Kabiru, ya 'Alimu ya Qadiru, ya Sami'u ya Basiru, ya Latifu ya Khabiru.",
        english: "O Exalted One, O Great One, O Knower, O All-Powerful, O All-Hearing, O All-Seeing, O Gentle One, O All-Aware.",
        malayalam: "അത്യുന്നതനായവനേ, വലിയവനേ, സർവ്വതും അറിയുന്നവനേ, സർവ്വശക്തനായവനേ, എല്ലാം കേൾക്കുന്നവനേ, എല്ലാം കാണുന്നവനേ, ദയാലുവായവനേ, സർവ്വ രഹസ്യങ്ങളും അറിയുന്നവനേ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 525,
        endTime: 558
    },
    {
        id: 19,
        title_en: "Reliever of Distress & Grief",
        title_ml: "വിഷമങ്ങൾ നീക്കുന്നവനേ",
        arabic: "يَا فَارِجَ الْهَمِّ، يَا كَاشِفَ الْغَمِّ، يَا مَنْ لِعَبْدِهِ يَغْفِرُ وَيَرْحَمُ",
        transliteration: "Ya Farijal-hammi, ya Kashifal-ghammi, ya Man li-'abdihi yaghfiru wa yarham.",
        english: "O Reliever of distress, O Remover of grief, O One who forgives and has mercy on His servant.",
        malayalam: "വിഷമങ്ങൾ അകറ്റുന്നവനേ, ദുഃഖങ്ങൾ ദൂരീകരിക്കുന്നവനേ, തന്റെ ദാസന് പൊറുത്തു കൊടുക്കുകയും കരുണ ചൊരിയുകയും ചെയ്യുന്നവനേ.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 558,
        endTime: 582
    },
    {
        id: 20,
        title_en: "Absolute Seeking of Forgiveness",
        title_ml: "പാപмоചനം അപേക്ഷിക്കൽ",
        arabic: "أَسْتَغْفِرُ اللَّهَ رَبَّ الْبَرَايَا، أَسْتَغْفِرُ اللَّهَ مِنَ الْخَطَايَا",
        transliteration: "Astaghfirullaha Rabbal-baraya, astaghfirullaha minal-khataya.",
        english: "I seek forgiveness from Allah, the Lord of creation; I seek forgiveness from Allah for all my sins.",
        malayalam: "സൃഷ്ടികളുടെ സംരക്ഷകനായ അല്ലാഹുവിനോട് ഞാൻ പാപമോചനം തേടുന്നു. സർവ്വ അബദ്ധങ്ങളിൽ നിന്നും പാപങ്ങളിൽ നിന്നും ഞാൻ അവനോട് പൊറുക്കലിനെ ഇരക്കുന്നു.",
        repeat: 4,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 582,
        endTime: 608
    },
    {
        id: 21,
        title_en: "Declaration of Faith (Lailaha illallah)",
        title_ml: "ലാ ഇലാഹ ഇല്ലല്ലാഹ്",
        arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
        transliteration: "La ilaha illallah.",
        english: "There is no deity but Allah.",
        malayalam: "അല്ലാഹുവല്ലാതെ യാതൊരു ആരാധനക്കർഹനില്ല.",
        repeat: 50,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 608,
        endTime: 710
    },
    {
        id: 22,
        title_en: "Muhammad is the Messenger of Allah",
        title_ml: "മുഹമ്മദ് റസൂലുള്ളാഹ്",
        arabic: "مُحَمَّدٌ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَآلِهِ وَسَلَّمَ، وَشَرَّفَ وَكَرَّمَ وَعَظَّمَ وَبَجَّلَ",
        transliteration: "Muhammadur-Rasulullahi sallallahu 'alayhi wa alihi wa sallima wa sharrafa wa karrama wa 'athama wa bajjala.",
        english: "Muhammad is the Messenger of Allah, blessings and peace of Allah be upon him, his family and companions, which He has honored, exalted, and glorified.",
        malayalam: "മുഹമ്മദ് നബി അല്ലാഹുവിന്റെ ദൂതനാകുന്നു. അല്ലാഹുവിന്റെ അനുഗ്രഹങ്ങളും സമാധാനവും അദ്ദേഹത്തിന്റേയും കുടുംബത്തിന്റേയും മേൽ വർഷിക്കട്ടെ. അവൻ അദ്ദേഹത്തെ ആദരിക്കുകയും ബഹുമാനിക്കുകയും ഉയർത്തുകയും ചെയ്തിരിക്കുന്നു.",
        repeat: 1,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 710,
        endTime: 735
    },
    {
        id: 23,
        title_en: "Surah Al-Ikhlas (Purity of Faith)",
        title_ml: "സൂറത്തുൽ ഇഖ്‌ലാസ്",
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞ قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
        transliteration: "Bismillahir-Rahmanir-Rahim. Qul Huwallahu Ahad. Allahus-Samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.",
        english: "Say, He is Allah, One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.",
        malayalam: "പറയുക: അവൻ അല്ലാഹു ഏകനാകുന്നു. അല്ലാഹു എല്ലാവരാലും ആശ്രയിക്കപ്പെടുന്നവനാകുന്നു. അവൻ ജനിപ്പിച്ചിട്ടില്ല, ജനിക്കപ്പെട്ടിട്ടുമില്ല. അവന് തുല്യനായി ആരുമില്ല.",
        repeat: 3,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 735,
        endTime: 760
    },
    {
        id: 24,
        title_en: "Surah Al-Falaq (The Daybreak)",
        title_ml: "സൂറത്തുൽ ഫലഖ്",
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۞ مِن شَرِّ مَا خَلَقَ ۞ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۞ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۞ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        transliteration: "Bismillahir-Rahmanir-Rahim. Qul a'uthu bi-Rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin itha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin itha hasad.",
        english: "Say, I seek refuge in the Lord of daybreak. From the evil of that which He created. And from the evil of darkness when it settles. And from the evil of the blowers in knots. And from the evil of an envier when he envies.",
        malayalam: "പറയുക: പുലരിയുടെ രക്ഷിതാവിനോട് ഞാൻ രക്ഷതേടുന്നു. അവൻ സൃഷ്ടിച്ചിട്ടുള്ളവയുടെ തിന്മയിൽ നിന്ന്. ഇരുളടയുമ്പോൾ രാത്രിയുടെ തിന്മയിൽ നിന്ന്. കെട്ടുകളിൽ ഊതുന്ന സ്ത്രീകളുടെ തിന്മയിൽ നിന്ന്. അസൂയക്കാരൻ അസൂയപ്പെടുമ്പോൾ അവന്റെ തിന്മയിൽ നിന്നും.",
        repeat: 1,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 760,
        endTime: 778
    },
    {
        id: 25,
        title_en: "Surah An-Nas (Mankind)",
        title_ml: "സൂറത്തുൽ നാസ്",
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۞ مَلِكِ النَّاسِ ۞ إِلَٰهِ النَّاسِ ۞ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۞ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۞ مِنَ الْجِنَّةِ وَالنَّاسِ",
        transliteration: "Bismillahir-Rahmanir-Rahim. Qul a'uthu bi-Rabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Allathi yuwaswisu fi sudwrin-nas. Minal-jinnati wan-nas.",
        english: "Say, I seek refuge in the Lord of mankind. The Sovereign of mankind. The God of mankind. From the evil of the retreating whisperer. Who whispers [evil] into the breasts of mankind. From among the jinn and mankind.",
        malayalam: "പറയുക: മനുഷ്യരുടെ രക്ഷിതാവിനോട് ഞാൻ രക്ഷതേടുന്നു. മനുഷ്യരുടെ രാജാവിനോട്. മനുഷ്യരുടെ ദൈവത്തോട്. ദുർബോധനം നടത്തി പിൻമാറിക്കളയുന്ന പിശാചിന്റെ തിന്മയിൽ നിന്ന്. മനുഷ്യരുടെ ഹൃദയങ്ങളിൽ ദുർബോധനം നടത്തുന്നവൻ. മനുഷ്യരിലും ജിന്നുകളിലും പെട്ടവൻ.",
        repeat: 1,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 778,
        endTime: 798
    },
    {
        id: 26,
        title_en: "Closing Al-Fatihah",
        title_ml: "സമാപന ഫാത്തിഹ സമർപ്പണം",
        arabic: "الْفَاتِحَةَ إِلَىٰ رُوحِ سَيِّدِنَا وَحَبِيبِنَا وَشَفِيعِنَا رَسُولِ اللَّهِ، وَإِلَىٰ رُوحِ سَيِّدِنَا الْإِمَامِ عَبْدِ اللَّهِ بْنِ عَلَوِيِّ الْهَدَّادِ، أَنَّ اللَّهَ يُعْلِي دَرَجَاتِهِمْ فِي الْجَنَّةِ وَيَنْفَعُنَا بِأَسْرَارِهِمْ وَأَنْوَارِهِمْ وَعُلُومِهِمْ فِي الدِّينِ وَالدُّنْيَا وَالْآخِرَةِ",
        transliteration: "Al-Fatihah ila ruhi sayyidina wa habibina wa shafi'ina Rasulillah, wa ila ruhi sayyidinal-Imami Abdullah bin Alawi al-Haddad, annallaha yu'li darajatihim fil-jannati wa yanfa'una bi-asrarihim wa anwarihim wa 'ulumihim fid-dini wad-dunya wal-akhirah.",
        english: "We recite Al-Fatihah to the soul of our master, beloved, and intercessor, the Messenger of Allah, and to the soul of Imam Abdullah bin Alawi al-Haddad, that Allah may elevate their ranks in Paradise and benefit us through their secrets, lights, and knowledge in this world and the Hereafter.",
        malayalam: "ഞങ്ങളുടെ നായകനും ശുപാർശകനുമായ അല്ലാഹുവിന്റെ റസൂലിന്റെ ആത്മാവിലേക്കും, ഇമാം അബ്ദുള്ള ബിൻ അലവി അൽ ഹദ്ദാദിന്റെ ആത്മാവിലേക്കും ഞങ്ങൾ ഫാത്തിഹ സമർപ്പിക്കുന്നു. അല്ലാഹു അവരുടെ പദവികൾ സ്വർഗ്ഗത്തിൽ ഉയർത്തുകയും അവരുടെ രഹസ്യങ്ങൾ, പ്രകാശങ്ങൾ, അറിവുകൾ എന്നിവയാൽ ഇഹലോകത്തും പരലോകത്തും നമുക്ക് ഉപകാരം ചെയ്യുമാറാകട്ടെ.",
        repeat: 1,
        audioSrc: "https://archive.org/download/ratheeb-al-haddad-audio/Ratheeb%20Al-Haddad.mp3",
        startTime: 798,
        endTime: 850
    }
];

const AUDIO_URL = "https://archive.org/download/RatibAlHaddad/Ratib%20alHaddad_09.mp3";
const REMINDER_ID = 401;

export default function RatheebHaddad() {
    const navigate = useNavigate();
    const { lang } = useLanguage();

    // 1. Core States
    const [scrollProgress, setScrollProgress] = useState(0);
    const [counts, setCounts] = useState(() => {
        const saved = localStorage.getItem('rh_counts');
        try { return saved ? JSON.parse(saved) : {}; } catch (e) { return {}; }
    });
    const [bookmarks, setBookmarks] = useState(() => {
        const saved = localStorage.getItem('rh_bookmarks');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });
    const [filterMode, setFilterMode] = useState('all');

    // 2. Audio & Buffering States
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [activeSectionId, setActiveSectionId] = useState(1);
    // Player Expand State & Settings
    const [playerExpanded, setPlayerExpanded] = useState(false);

    const [reminderEnabled, setReminderEnabled] = useState(() => {
        return localStorage.getItem('rh_reminder_enabled') === 'true';
    });

    // Refs for synchronization to prevent stale state captures in async event loops
    const audioRef = useRef(null);
    const activeSectionIdRef = useRef(1);

    // Save user selections
    useEffect(() => { localStorage.setItem('rh_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
    useEffect(() => { localStorage.setItem('rh_counts', JSON.stringify(counts)); }, [counts]);

    // Handle viewport scroll progress bar
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight > 0) {
                setScrollProgress((window.scrollY / totalHeight) * 100);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Request & Sync local post-Maghrib notifications
    const syncNotification = useCallback(async (enabled) => {
        localStorage.setItem('rh_reminder_enabled', enabled ? 'true' : 'false');
        setReminderEnabled(enabled);
        try {
            await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
            if (enabled) {
                const perm = await LocalNotifications.requestPermissions();
                if (perm.display === 'granted') {
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: REMINDER_ID,
                            title: lang === 'ml' ? "റാത്തീബുൽ ഹദ്ദാദ് സമയം <Icons.BeadsIcon />" : "Ratheeb al-Haddad Time <Icons.BeadsIcon />",
                            body: lang === 'ml' 
                                ? "ആത്മീയ ശാന്തിക്കായി ഇന്നത്തെ റാത്തീബ് ഓതാൻ സമയമായി." 
                                : "Time to recite today's Ratheeb al-Haddad for peace and protection.",
                            schedule: { on: { hour: 18, minute: 30 }, repeats: true, allowWhileIdle: true },
                            sound: 'beep.wav'
                        }]
                    });
                } else {
                    setReminderEnabled(false);
                }
            }
        } catch (e) {
            console.warn("Local notifications not available", e);
        }
    }, [lang]);

    // Recover saved position after initial component load
    useEffect(() => {
        const savedTime = localStorage.getItem('rh_audio_position');
        if (savedTime && audioRef.current) {
            const parsed = parseFloat(savedTime);
            audioRef.current.currentTime = parsed;
            setCurrentTime(parsed);
        }
    }, []);

    // Update playback speed rate on physical audio driver
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Native JSX Audio event handlers
    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const cur = audioRef.current.currentTime;
        setCurrentTime(cur);
        localStorage.setItem('rh_audio_position', cur.toString());

        // Synced highlighting matching starting-ending audio intervals
        let matched = RATHEEB_SECTIONS.find(sec => cur >= sec.startTime && cur < sec.endTime);
        
        // Fallback for tight gaps between timestamps
        if (!matched) {
            matched = [...RATHEEB_SECTIONS].reverse().find(sec => cur >= sec.startTime);
        }

        if (matched) {
            if (activeSectionIdRef.current !== matched.id) {
                activeSectionIdRef.current = matched.id;
                setActiveSectionId(matched.id);
                // Scrolling is now elegantly handled by the centralized useEffect
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
    };

    const handleAudioError = (e) => {
        console.error("Audio error event:", e);
        setAudioError(true);
        setIsPlaying(false);
        setIsBuffering(false);
    };

    const handleRetryAudio = () => {
        setAudioError(false);
        setIsBuffering(true);
        if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play().catch(e => {
                console.warn("Play failed after reload", e);
                setIsBuffering(false);
            });
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            setAudioError(false);
            audioRef.current.play().catch(e => {
                console.warn("Audio play blocked/failed", e);
                setAudioError(true);
            });
        }
    };

    const handleResetPlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
            
            setActiveSectionId(1);
            activeSectionIdRef.current = 1;
            
            if (autoScrollSpeed > 0) {
                // Let the useEffect handle it, just trigger a state change if needed
            }
            
            setAudioError(false);
            audioRef.current.play().catch(e => {
                console.warn("Reset play failed", e);
                setAudioError(true);
            });
        }
    };

    const handleSeek = (e) => {
        const val = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = val;
            setCurrentTime(val);
            
            // Instantly sync highlight and scroll to prevent visual lag
            const matched = [...RATHEEB_SECTIONS].reverse().find(sec => val >= sec.startTime);
            if (matched && activeSectionIdRef.current !== matched.id) {
                activeSectionIdRef.current = matched.id;
                setActiveSectionId(matched.id);
                // Scrolling is handled by the useEffect
            }
        }
    };

    const skipTime = (amount) => {
        if (audioRef.current) {
            let next = audioRef.current.currentTime + amount;
            if (next < 0) next = 0;
            if (next > duration) next = duration;
            audioRef.current.currentTime = next;
            setCurrentTime(next);
        }
    };

    const jumpToSection = (sectionId) => {
        const target = RATHEEB_SECTIONS.find(s => s.id === sectionId);
        if (target && audioRef.current) {
            audioRef.current.currentTime = target.startTime;
            setCurrentTime(target.startTime);
            setActiveSectionId(sectionId);
            activeSectionIdRef.current = sectionId;

            // Scrolling is handled safely by the centralized useEffect
            if (!isPlaying) {
                audioRef.current.play().catch(() => {});
            }
        }
    };

    const nextSection = () => {
        if (activeSectionId < RATHEEB_SECTIONS.length) {
            jumpToSection(activeSectionId + 1);
        }
    };

    const prevSection = () => {
        if (activeSectionId > 1) {
            jumpToSection(activeSectionId - 1);
        }
    };

    // Increment repeat count counters
    const handleIncrementCount = (id, target) => {
        const current = counts[id] || 0;
        if (current >= target) {
            setCounts(prev => ({ ...prev, [id]: 0 }));
        } else {
            setCounts(prev => ({ ...prev, [id]: current + 1 }));
            if (navigator.vibrate) navigator.vibrate(30);
        }
    };

    const toggleBookmark = (id) => {
        setBookmarks(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const resetAllCounts = () => {
        setCounts({});
        if (navigator.vibrate) navigator.vibrate([40, 40]);
    };

    const displayedSections = filterMode === 'bookmarks' 
        ? RATHEEB_SECTIONS.filter(sec => bookmarks.includes(sec.id))
        : RATHEEB_SECTIONS;

    const currentSection = RATHEEB_SECTIONS.find(s => s.id === activeSectionId) || RATHEEB_SECTIONS[0];
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatDuration = (sec) => {
        if (isNaN(sec)) return "00:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`ratheeb-root ${playerExpanded ? 'player-is-expanded' : 'player-is-collapsed'}`}>
            {/* HTML5 Audio Stream Driver Node */}
            <audio
                ref={audioRef}
                src={AUDIO_URL}
                preload="auto"
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
                onPlaying={() => { setIsPlaying(true); setIsBuffering(false); }}
                onEnded={handleEnded}
                onError={handleAudioError}
            />

            {/* Top Linear Progress Indicator */}
            <div className="rh-progress-bar" style={{ width: `${scrollProgress}%` }} />

            {/* Premium Sticky Header bar */}
            <header className="ratheeb-header">
                <button className="rh-back-btn" onClick={() => navigate('/more')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                </button>
                <h1 className="rh-header-title">{lang === 'ml' ? 'റാത്തീബുൽ ഹദ്ദാദ്' : 'Ratheeb al-Haddad'}</h1>
                <div className="rh-header-actions">
                    <button 
                        className={`rh-icon-btn ${filterMode === 'bookmarks' ? 'active' : ''}`}
                        onClick={() => setFilterMode(filterMode === 'all' ? 'bookmarks' : 'all')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={filterMode === 'bookmarks' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                        </svg>
                    </button>
                </div>
            </header>

            {/* Content List with Safe Bottom Padding to allow the final sections to scroll to the center */}
            <div 
                className="rh-reading-container" 
                style={{ paddingBottom: playerExpanded ? 'calc(50vh + 240px)' : 'calc(50vh + 150px)' }}
            >
                {/* Spiritual Daily Reminder Switch */}
                <div className="rh-reminder-panel">
                    <div className="rh-reminder-text-box">
                        <span className="rh-reminder-title">
                            {lang === 'ml' ? "പ്രതിദിന റാത്തീബ് നോട്ടിഫിക്കേഷൻ" : "Daily Maghrib Reminder"}
                        </span>
                        <p className="rh-reminder-desc">
                            {lang === 'ml' ? "എല്ലാ ദിവസവും മഗ്‌രിബിന് ശേഷം ഓതാൻ ഓർമ്മിപ്പിക്കുന്നു." : "Receive a gentle notification at 6:30 PM to recite daily."}
                        </p>
                    </div>
                    <label className="rh-switch">
                        <input 
                            type="checkbox" 
                            checked={reminderEnabled} 
                            onChange={(e) => syncNotification(e.target.checked)} 
                        />
                        <span className="rh-slider" />
                    </label>
                </div>

                {/* Quick controls panel */}
                <div className="rh-dashboard-bar">
                    <span className="rh-badge-info">
                        {lang === 'ml' ? `${RATHEEB_SECTIONS.length} ഭാഗങ്ങൾ` : `${RATHEEB_SECTIONS.length} Sections`}
                    </span>
                    <button className="rh-control-btn" onClick={resetAllCounts} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/>
                        </svg>
                        {lang === 'ml' ? 'കൗണ്ടറുകൾ റീസെറ്റ് ചെയ്യുക' : 'Reset Counters'}
                    </button>
                </div>

                {displayedSections.length === 0 && (
                    <div className="rh-empty-notice">
                        {lang === 'ml' ? "ബുക്ക്മാർക്ക് ചെയ്ത ഭാഗങ്ങളൊന്നുമില്ല." : "No bookmarked sections found."}
                    </div>
                )}

                {/* Liturgy cards loop */}
                {displayedSections.map(sec => {
                    const progress = counts[sec.id] || 0;
                    const isCardDone = progress >= sec.repeat;
                    const isHighlighted = activeSectionId === sec.id;
                    const isBookmarked = bookmarks.includes(sec.id);

                    return (
                        <div 
                            key={sec.id}
                            className={`rh-dhikr-card ${isHighlighted ? 'active-reading' : ''} ${isCardDone ? 'card-completed' : ''}`}
                            onClick={() => jumpToSection(sec.id)}
                        >
                            <div className="rh-card-top">
                                <span className="rh-section-num">#{sec.id}</span>
                                <span className="rh-section-title">
                                    {lang === 'ml' ? sec.title_ml : sec.title_en}
                                </span>
                                <button 
                                    className={`rh-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); toggleBookmark(sec.id); }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                                    </svg>
                                </button>
                            </div>

                            <div className="rh-arabic-text">
                                {sec.arabic}
                            </div>

                            <div className="rh-transliteration">
                                {sec.transliteration}
                            </div>

                            <div className="rh-translation">
                                {lang === 'ml' ? sec.malayalam : sec.english}
                            </div>

                            <div className="rh-counter-wrapper">
                                <button 
                                    className={`rh-counter-button ${isCardDone ? 'completed' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleIncrementCount(sec.id, sec.repeat); }}
                                >
                                    <span><Icons.BeadsIcon /></span>
                                    <span className="rh-counter-num">
                                        {isCardDone ? <Icons.CheckIcon /> : `${progress} `}
                                        <span className="rh-counter-target">/ ×{sec.repeat}</span>
                                    </span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* <Icons.NoteIcon /> COMPACT BOTTOM DOCK SPOTIFY-STYLE PLAYER */}
            <div className={`rh-spotify-player ${playerExpanded ? 'expanded' : 'collapsed'} ${audioError ? 'has-error' : ''}`}>
                
                {/* Error Banner state */}
                {audioError && (
                    <div className="rh-player-error-banner">
                        <span><Icons.WarningIcon /> {lang === 'ml' ? "ഓഡിയോ ലഭ്യമാകുന്നില്ല" : "Audio unavailable"}</span>
                        <button className="rh-retry-btn" onClick={handleRetryAudio}>
                            {lang === 'ml' ? "വീണ്ടും ശ്രമിക്കുക" : "Retry"}
                        </button>
                    </div>
                )}

                {/* Seeker / Scrub timeline bar */}
                <div className="rh-player-progress-container">
                    <input 
                        type="range" 
                        className="rh-player-seek"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                    />
                    <div className="rh-progress-fill-visual" style={{ width: `${progressPercent}%` }} />
                </div>

                {/* Collapsed State Panel */}
                {!playerExpanded ? (
                    <div className="rh-collapsed-inner-row" onClick={() => setPlayerExpanded(true)}>
                        <button className="rh-mini-play-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                            {isBuffering ? (
                                <div className="rh-spinner-mini" />
                            ) : isPlaying ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            )}
                        </button>

                        <div className="rh-mini-info-block">
                            <span className="rh-mini-section-title">
                                {lang === 'ml' ? currentSection.title_ml : currentSection.title_en}
                            </span>
                            <span className="rh-mini-duration">
                                {formatDuration(currentTime)} / {formatDuration(duration)}
                            </span>
                        </div>

                        <div className="rh-mini-arrow" onClick={(e) => { e.stopPropagation(); setPlayerExpanded(true); }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                        </div>
                    </div>
                ) : (
                    /* Expanded State Panel */
                    <div className="rh-expanded-inner-layout">
                        {/* Upper row: Info and Main controls */}
                        <div className="rh-expanded-main-row">
                            <div className="rh-expanded-info-box" onClick={() => setPlayerExpanded(false)}>
                                <span className="rh-expanded-section-title">
                                    {lang === 'ml' ? currentSection.title_ml : currentSection.title_en}
                                </span>
                                <span className="rh-expanded-subtitle">
                                    {formatDuration(currentTime)} / {formatDuration(duration)}
                                </span>
                            </div>

                            <div className="rh-expanded-controls-group">
                                <button className="rh-control-trigger secondary" onClick={handleResetPlayback} title={lang === 'ml' ? "ആദ്യത്തിൽ നിന്ന് തുടങ്ങുക" : "Restart from beginning"}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
                                </button>

                                <button className="rh-control-trigger secondary" onClick={prevSection} disabled={activeSectionId === 1}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                                </button>

                                <button className="rh-control-trigger play-round" onClick={togglePlay}>
                                    {isBuffering ? (
                                        <div className="rh-spinner-expanded" />
                                    ) : isPlaying ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    )}
                                </button>

                                <button className="rh-control-trigger secondary" onClick={nextSection} disabled={activeSectionId === RATHEEB_SECTIONS.length}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                                </button>
                            </div>

                            <button className="rh-expanded-collapse-chevron" onClick={() => setPlayerExpanded(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                        </div>

                        {/* Lower row: Settings configurations */}
                        <div className="rh-expanded-settings-row">
                            <div className="rh-setting-pill">
                                <span className="rh-setting-label">{lang === 'ml' ? 'വേഗത' : 'Speed'}</span>
                                <div className="rh-pill-selectors">
                                    {[1.0, 1.25, 1.5].map(rate => (
                                        <button 
                                            key={rate} 
                                            className={`rh-pill-opt ${playbackRate === rate ? 'selected' : ''}`}
                                            onClick={() => setPlaybackRate(rate)}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>


                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
