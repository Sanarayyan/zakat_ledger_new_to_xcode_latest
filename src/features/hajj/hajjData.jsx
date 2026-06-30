import * as Icons from '../../components/IconLibrary';
export const HAJJ_STEPS = [
  {
    id: 1, 
    day: "Before Hajj", 
    day_ml: "ഹജ്ജിന് മുൻപ്",
    title: "Spiritual Preparation",
    title_ml: "ആത്മീയ തയ്യാറെടുപ്പ്",
    icon: <Icons.HeartHandshakeIcon />, 
    color: "#1a5c3a",
    description: "Purify your intention (niyyah) sincerely for Allah alone. Repent from all sins, settle debts, seek forgiveness from those you have wronged, and make a will.",
    description_ml: "അല്ലാഹുവിനായി മാത്രം നിങ്ങളുടെ നിയ്യത്ത് (ഉദ്ദേശം) ശുദ്ധീകരിക്കുക. എല്ലാ പാപങ്ങളിൽ നിന്നും പശ്ചാത്തപിക്കുക, കടങ്ങൾ വീട്ടുക, നിങ്ങൾ ഉപദ്രവിച്ചവരോട് പൊറുക്കൽ ചോദിക്കുക, ഒരു വിൽപത്രം തയ്യാറാക്കുക.",
    sunnah: "Increase dhikr, read about Hajj rituals, learn the duas.",
    sunnah_ml: "ദിക്ർ വർദ്ധിപ്പിക്കുക, ഹജ്ജ് കർമ്മങ്ങളെക്കുറിച്ച് വായിക്കുക, ദുആകൾ പഠിക്കുക.",
    rules: "Intention must be solely for Allah (ikhlas). Hajj performed for show is not accepted.",
    rules_ml: "നിയ്യത്ത് അല്ലാഹുവിനായി മാത്രമായിരിക്കണം (ഇഖ്ലാസ്). പ്രകടനപരതയുള്ള ഹജ്ജ് സ്വീകരിക്കപ്പെടില്ല.",
    mistakes: "Going without knowledge of the rituals.",
    mistakes_ml: "ഹജ്ജ് കർമ്മങ്ങളെക്കുറിച്ച് അറിവില്ലാതെ പോകുന്നത്.",
    duas: [{ 
      arabic: "اللَّهُمَّ إِنِّي أُرِيدُ الحَجَّ فَيَسِّرْهُ لِي", 
      transliteration: "Allahumma inni uridu'l-hajja fa yassir-hu li", 
      meaning: "O Allah, I intend to perform Hajj, so make it easy for me.",
      meaning_ml: "അല്ലാഹുവേ, ഞാൻ ഹജ്ജ് ചെയ്യാൻ ഉദ്ദേശിക്കുന്നു, അതിനാൽ അത് എനിക്ക് എളുപ്പമാക്കേണമേ."
    }]
  },
  {
    id: 2, 
    day: "Day 1 (8 Dhul Hijjah)", 
    day_ml: "ഒന്നാം ദിവസം (ദുൽഹജ്ജ് 8)",
    title: "Entering Ihram",
    title_ml: "ഇഹ്റാമിൽ പ്രവേശിക്കൽ",
    icon: <Icons.ShirtIcon />, 
    color: "#8B6914",
    description: "Perform Ghusl (ritual bath), apply perfume to body (not clothes for men), wear Ihram garments. Men wear two white seamless cloths (izar & rida). Women wear normal modest clothing covering everything except face and hands.",
    description_ml: "ഗുസ്‌ൽ (കുളി) ചെയ്യുക, ശരീരത്തിൽ സുഗന്ധദ്രവ്യം പുരട്ടുക (പുരുഷന്മാർ വസ്ത്രത്തിൽ പുരട്ടരുത്), ഇഹ്റാം വസ്ത്രം ധരിക്കുക. പുരുഷന്മാർ തുന്നലില്ലാത്ത രണ്ട് വെള്ള വസ്ത്രങ്ങൾ ധരിക്കുന്നു. സ്ത്രീകൾ മുഖവും കൈപ്പത്തിയും ഒഴികെ ശരീരം മുഴുവൻ മറയ്ക്കുന്ന മാന്യമായ സാധാരണ വസ്ത്രം ധരിക്കുക.",
    sunnah: "Pray 2 rakaat before entering Ihram. Recite Talbiyah loudly (men) or softly (women).",
    sunnah_ml: "ഇഹ്റാമിൽ പ്രവേശിക്കുന്നതിന് മുൻപ് 2 റക്അത്ത് നമസ്കരിക്കുക. തൽബിയത്ത് ഉച്ചത്തിൽ (പുരുഷന്മാർ) അല്ലെങ്കിൽ പതുക്കെ (സ്ത്രീകൾ) ചൊല്ലുക.",
    rules: "Once in Ihram, prohibited: cutting hair/nails, applying perfume, covering head (men), sexual relations, hunting, marriage contracts.",
    rules_ml: "ഇഹ്റാമിൽ പ്രവേശിച്ചാൽ നിഷിദ്ധമായവ: മുടി/നഖം മുറിക്കൽ, സുഗന്ധദ്രവ്യം പുരട്ടൽ, തല മറയ്ക്കൽ (പുരുഷന്മാർ), ലൈംഗിക ബന്ധം, വേട്ടയാടൽ, വിവാഹ കരാറുകൾ.",
    mistakes: "Using perfume on Ihram clothes, wearing sewn garments (men).",
    mistakes_ml: "ഇഹ്റാം വസ്ത്രത്തിൽ സുഗന്ധദ്രവ്യം ഉപയോഗിക്കൽ, തുന്നിയ വസ്ത്രങ്ങൾ ധരിക്കൽ (പുരുഷന്മാർ).",
    duas: [
      { 
        arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ", 
        transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, inn al-hamda wa'n-ni'mata laka wa'l-mulk, la sharika lak", 
        meaning: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace and sovereignty belong to You. You have no partner.",
        meaning_ml: "അല്ലാഹുവേ, ഞാനിതാ നിന്റെ സന്നിധിയിൽ എത്തിയിരിക്കുന്നു. ഞാനിതാ എത്തിയിരിക്കുന്നു, നിനക്ക് യാതൊരു പങ്കുകാരനുമില്ല, ഞാനിതാ എത്തിയിരിക്കുന്നു. തീർച്ചയായും സർവ്വ സ്തുതിയും അനുഗ്രഹവും പരമാധികാരവും നിനക്കുള്ളതാണ്, നിനക്ക് യാതൊരു പങ്കുകാരനുമില്ല."
      }
    ]
  },
  {
    id: 3, 
    day: "Day 1", 
    day_ml: "ഒന്നാം ദിവസം",
    title: "Tawaf al-Qudum (Arrival Tawaf)",
    title_ml: "ത്വവാഫുൽ ഖുദൂം (ആഗമന ത്വവാഫ്)",
    icon: <Icons.KaabaIcon />, 
    color: "#2c5f8a",
    description: "Upon arriving in Makkah, perform Tawaf al-Qudum (Tawaf of Arrival). Circle the Kaaba 7 times counter-clockwise starting and ending at the Black Stone. Men perform Idtiba (expose right shoulder) and Ramal (brisk walk) in first 3 circuits.",
    description_ml: "മക്കയിൽ എത്തുമ്പോൾ ത്വവാഫുൽ ഖുദൂം നിർവ്വഹിക്കുക. ഹജറുൽ അസ്‌വദ് മുതൽ തുടങ്ങി കഅ്ബക്ക് ചുറ്റും ഇടത്തോട്ട് 7 തവണ വലംവെക്കുക. പുരുഷന്മാർ ആദ്യത്തെ 3 റൗണ്ടുകളിൽ വലതു തോൾ വെളിപ്പെടുത്തുകയും (ഇദ്തിബാഅ്) വേഗത്തിൽ നടക്കുകയും (രമൽ) ചെയ്യുക.",
    sunnah: "Touch or kiss the Black Stone if possible, otherwise point to it. Drink Zamzam water after.",
    sunnah_ml: "സാധ്യമെങ്കിൽ ഹജറുൽ അസ്‌വദ് ചുംബിക്കുകയോ തൊടുകയോ ചെയ്യുക, അല്ലെങ്കിൽ അതിന് നേരെ കൈ ചൂണ്ടുക. അതിനുശേഷം സംസം വെള്ളം കുടിക്കുക.",
    rules: "Must be in state of Wudu. Start from the Black Stone. Each circuit is complete when you return to the Black Stone.",
    rules_ml: "വുദൂ ഉണ്ടായിരിക്കണം. ഹജറുൽ അസ്‌വദിന് നേരെ നിന്ന് തുടങ്ങണം. ഓരോ റൗണ്ടും ഹജറുൽ അസ്‌വദിന്റെ അടുത്ത് തിരിച്ചെത്തുമ്പോൾ പൂർത്തിയാകുന്നു.",
    mistakes: "Pushing and harming others to touch the Black Stone. Arguing during Tawaf.",
    mistakes_ml: "ഹജറുൽ അസ്‌വദ് തൊടാൻ വേണ്ടി മറ്റുള്ളവരെ തള്ളിമാറ്റുന്നതും ദ്രോഹിക്കുന്നതും. ത്വവാഫിനിടയിൽ തർക്കങ്ങളിൽ ഏർപ്പെടുന്നത്.",
    duas: [{ 
      arabic: "بِسْمِ اللَّهِ، وَاللَّهُ أَكْبَرُ، اللَّهُمَّ إِيمَاناً بِكَ، وَتَصْدِيقاً بِكِتَابِكَ، وَوَفَاءً بِعَهْدِكَ، وَاتِّبَاعاً لِسُنَّةِ نَبِيِّكَ", 
      transliteration: "Bismillah, Allahu Akbar, Allahumma imanan bika wa tasdiqan bikitabika wa wafa'an bi'ahdika wattiba'an li sunnatinabiyyika", 
      meaning: "In the name of Allah, Allah is Greatest. O Allah, with faith in You, believing in Your Book, fulfilling Your covenant, and following the Sunnah of Your Prophet.",
      meaning_ml: "അല്ലാഹുവിന്റെ നാമത്തിൽ, അല്ലാഹുവാണ് ഏറ്റവും വലിയവൻ. അല്ലാഹുവേ, നിന്നിലുള്ള വിശ്വാസത്തോടും നിന്റെ വേദഗ്രന്ഥത്തിലുള്ള സാക്ഷ്യത്തോടും നിന്റെ കരാർ പാലിച്ചുകൊണ്ടും നിന്റെ പ്രവാചകന്റെ ചര്യ പിന്തുടർന്നുകൊണ്ടും ഞാൻ ഇത് ചെയ്യുന്നു."
    }]
  },
  {
    id: 4, 
    day: "Day 1", 
    day_ml: "ഒന്നാം ദിവസം",
    title: "Sa'i between Safa & Marwah",
    title_ml: "സഫാ മർവ്വക്കിടയിലെ സഅ്‌യ്",
    icon: <Icons.FootprintsIcon />, 
    color: "#5a3e8a",
    description: "Walk 7 times between the hills of Safa and Marwah, commemorating Hajar's search for water for her son Ismail (AS). Start at Safa and end at Marwah. Men run between the green markers.",
    description_ml: "ഹാജറ ബീവി തന്റെ മകൻ ഇസ്മാഈലിനായി വെള്ളം അന്വേഷിച്ചതിന്റെ ഓർമ്മക്കായി സഫാ, മർവ്വ എന്നീ കുന്നുകൾക്കിടയിൽ 7 തവണ നടക്കുക. സഫായിൽ തുടങ്ങി മർവ്വയിൽ അവസാനിക്കുക. പച്ച അടയാളങ്ങൾക്കിടയിൽ പുരുഷന്മാർ വേഗത്തിൽ ഓടുക.",
    sunnah: "Begin at Safa, face the Kaaba and make dua. Recite the dua at both Safa and Marwah.",
    sunnah_ml: "സഫായിൽ തുടങ്ങി കഅ്ബക്ക് നേരെ തിരിഞ്ഞ് ദുആ ചെയ്യുക. സഫായിലും മർവ്വയിലും എത്തുമ്പോൾ ദുആ ആവർത്തിക്കുക.",
    rules: "Ihram not required but Wudu is recommended. One trip Safa→Marwah counts as 1; 7 total.",
    rules_ml: "ഇഹ്റാം നിർബന്ധമില്ലെങ്കിലും വുദൂ ശുപാർശ ചെയ്യുന്നു. സഫാ മുതൽ മർവ്വ വരെയുള്ള ഒരു യാത്ര ഒരു തവണയായി കണക്കാക്കുന്നു. ആകെ 7 തവണ.",
    mistakes: "Counting incorrectly — must start at Safa, end at Marwah.",
    mistakes_ml: "തെറ്റായി എണ്ണുന്നത് — സഫായിൽ തുടങ്ങി മർവ്വയിൽ അവസാനിക്കണം.",
    duas: [{ 
      arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ", 
      transliteration: "Inn as-Safa wa'l-Marwata min sha'a'irillah. Abda'u bima bada'a Allahu bihi", 
      meaning: "Indeed Safa and Marwah are among the signs of Allah. I begin with what Allah began with.",
      meaning_ml: "തീർച്ചയായും സഫായും മർവ്വയും അല്ലാഹുവിന്റെ അടയാളങ്ങളിൽ പെട്ടതാണ്. അല്ലാഹു ആരംഭിച്ചതുകൊണ്ട് ഞാൻ ആരംഭിക്കുന്നു."
    }]
  },
  {
    id: 5, 
    day: "Day 1 (8 Dhul Hijjah)", 
    day_ml: "ഒന്നാം ദിവസം (ദുൽഹജ്ജ് 8)",
    title: "Travel to Mina",
    title_ml: "മിനായിലേക്ക് പോകൽ",
    icon: <Icons.LocationIcon />, 
    color: "#8a5a1a",
    description: "On the 8th of Dhul Hijjah (Yawm at-Tarwiyah), travel to Mina and spend the night there. This is Sunnah. Pray Dhuhr, Asr, Maghrib, Isha (shortened but not combined) and Fajr in Mina.",
    description_ml: "ദുൽഹജ്ജ് 8-ന് മിനായിലേക്ക് പോകുകയും അവിടെ രാത്രി താമസിക്കുകയും ചെയ്യുക. ഇത് പ്രവാചകചര്യയാണ്. മിനായിൽ വെച്ച് ളുഹ്ർ, അസർ, മഗ്‌രിബ്, ഇശാ (ചുരുക്കി നമസ്കരിക്കുക, എന്നാൽ ഒരുമിച്ച് കൂട്ടരുത്), ഫജ്ർ എന്നിവ നമസ്കരിക്കുക.",
    sunnah: "Arrive in Mina before Dhuhr. Prayers are shortened to 2 rakaat (Qasr) for travelers.",
    sunnah_ml: "ളുഹ്റിന് മുൻപായി മിനായിൽ എത്തുക. യാത്രക്കാർക്ക് നമസ്കാരങ്ങൾ 2 റക്അത്തായി ചുരുക്കി നമസ്കരിക്കാം.",
    rules: "Remain in Ihram. Continue reciting Talbiyah.",
    rules_ml: "ഇഹ്റാമിൽ തുടരുക. തൽബിയത്ത് ചൊല്ലുന്നത് തുടരുക.",
    mistakes: "Skipping Mina overnight stay — it is an important Sunnah.",
    mistakes_ml: "മിനായിലെ രാത്രി താമസം ഒഴിവാക്കുന്നത് — ഇത് പ്രധാനപ്പെട്ട പ്രവാചകചര്യയാണ്.",
    duas: []
  },
  {
    id: 6, 
    day: "Day of Arafah (9 Dhul Hijjah)", 
    day_ml: "അറഫാ ദിനം (ദുൽഹജ്ജ് 9)",
    title: "Standing at Arafah (Wuquf)",
    title_ml: "അറഫയിലെ നിർത്തം (വുഖൂഫ്)",
    icon: <Icons.MountainIcon />, 
    color: "#c0392b",
    description: "THE MOST IMPORTANT PILLAR OF HAJJ. 'Hajj is Arafah' (Hadith — Ibn Majah). After sunrise, travel to Arafah. Stand in supplication from Dhuhr until sunset. Combine Dhuhr and Asr prayers (Qasr). Make maximum dua, dhikr, istiffar, and Talbiyah.",
    description_ml: "ഹജ്ജിന്റെ ഏറ്റവും പ്രധാനപ്പെട്ട കർമ്മം. 'ഹജ്ജ് എന്നാൽ അറഫയാണ്' (ഹദീസ്). സൂര്യോദയത്തിന് ശേഷം അറഫയിലേക്ക് യാത്ര ചെയ്യുക. ഉച്ച മുതൽ സൂര്യാസ്തമയം വരെ പ്രാർത്ഥനയിൽ ഏർപ്പെടുക. ളുഹ്റും അസറും ഒരുമിച്ച് ചുരുക്കി നമസ്കരിക്കുക. പരമാവധി പ്രാർത്ഥനകൾ, ദിക്റുകൾ, ഇസ്തിഗ്ഫാർ, തൽബിയത്ത് എന്നിവ ചൊല്ലുക.",
    sunnah: "Face the Qiblah. Raise hands in dua. Recite Quran. The Prophet ﷺ made dua on the hill of Jabal al-Rahmah.",
    sunnah_ml: "ഖിബ്‌ലക്ക് നേരെ തിരിയുക. ദുആക്കായി കൈകൾ ഉയർത്തുക. ഖുർആൻ പാരായണം ചെയ്യുക. പ്രവാചകൻ ﷺ ജബലു റഹ്മ കുന്നിൽ വെച്ചാണ് ദുആ ചെയ്തത്.",
    rules: "Must be present in Arafah at any point between Dhuhr of 9th and Fajr of 10th. Missing Arafah invalidates Hajj.",
    rules_ml: "ദുൽഹജ്ജ് 9-ലെ ഉച്ചക്കും പത്താം ദിവസത്തെ പ്രഭാതത്തിനും ഇടയിൽ ഏതെങ്കിലും സമയത്ത് അറഫയിൽ സന്നിഹിതനാകണം. അറഫാ സംഗമം നഷ്ടപ്പെട്ടാൽ ഹജ്ജ് അസാധുവാകും.",
    mistakes: "Leaving Arafah before sunset. Staying on the road outside Arafah boundaries.",
    mistakes_ml: "സൂര്യാസ്തമയത്തിന് മുൻപ് അറഫയിൽ നിന്ന് പുറപ്പെടുന്നത്. അറഫയുടെ അതിർത്തികൾക്ക് പുറത്ത് റോഡുകളിൽ തങ്ങുന്നത്.",
    duas: [{ 
      arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", 
      transliteration: "La ilaha illallahu wahdahu la sharika lahu, lahu'l-mulku wa lahu'l-hamdu wa huwa 'ala kulli shay'in qadir", 
      meaning: "There is no god but Allah alone, with no partner. His is the sovereignty and His is the praise, and He has power over all things.",
      meaning_ml: "അല്ലാഹുവല്ലാതെ യാതൊരു ദൈവവുമില്ല, അവൻ ഏകനാണ്, അവന് യാതൊരു പങ്കുകാരനുമില്ല. അവനാണ് പരമാധികാരവും സ്തുതിയും, അവൻ എല്ലാ കാര്യങ്ങൾക്കും കഴിവുള്ളവനാണ്."
    }]
  },
  {
    id: 7, 
    day: "Night 9-10 Dhul Hijjah", 
    day_ml: "ദുൽഹജ്ജ് 9-10 രാത്രി",
    title: "Muzdalifah",
    title_ml: "മുസ്ദലിഫ",
    icon: <Icons.CrescentIcon />, 
    color: "#1a3a5c",
    description: "After sunset, travel from Arafah to Muzdalifah. Combine Maghrib and Isha prayers upon arrival. Spend the night (or most of it) in Muzdalifah. Collect 49 or 70 pebbles (size of a chickpea) for stoning the Jamarat.",
    description_ml: "സൂര്യാസ്തമയത്തിന് ശേഷം അറഫയിൽ നിന്ന് മുസ്ദലിഫയിലേക്ക് യാത്ര ചെയ്യുക. അവിടെയെത്തിയ ശേഷം മഗ്‌രിബും ഇശായും ഒരുമിച്ച് നമസ്കരിക്കുക. രാത്രി മുസ്ദലിഫയിൽ താമസിക്കുക. ജംറകളിൽ എറിയാൻ ആവശ്യമായ 49 അല്ലെങ്കിൽ 70 ചെറിയ കല്ലുകൾ ശേഖരിക്കുക.",
    sunnah: "Pray Fajr in Muzdalifah. Make dua after Fajr facing Qiblah. Elderly and weak may leave after midnight.",
    sunnah_ml: "മുസ്ദലിഫയിൽ വെച്ച് സുബഹി നമസ്കരിക്കുക. അതിനുശേഷം ഖിബ്‌ലക്ക് നേരെ തിരിഞ്ഞ് ദുആ ചെയ്യുക. പ്രായമായവർക്കും ദുർബലർക്കും അർദ്ധരാത്രിക്ക് ശേഷം പോകാം.",
    rules: "Must spend at least part of the night in Muzdalifah (scholars differ on minimum time).",
    rules_ml: "രാത്രിയുടെ ഒരു ഭാഗമെങ്കിലും മുസ്ദലിഫയിൽ താമസിക്കണം (കുറഞ്ഞ സമയത്തെക്കുറിച്ച് പണ്ഡിതന്മാർക്ക് വ്യത്യസ്ത അഭിപ്രായമുണ്ട്).",
    mistakes: "Leaving Muzdalifah before Fajr without necessity. Collecting very large pebbles.",
    mistakes_ml: "യാതൊരു കാരണവുമില്ലാതെ ഫജ്റിന് മുൻപ് മുസ്ദലിഫ വിട്ടുപോകുന്നത്. വളരെ വലിയ കല്ലുകൾ ശേഖരിക്കുന്നത്.",
    duas: [{ 
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ أَنْ تُيَسِّرَ لِي مَا يُرْضِيكَ مِنِّي", 
      transliteration: "Allahumma inni as'aluka an tuyassira li ma yurdika minni", 
      meaning: "O Allah, I ask You to make easy for me whatever pleases You of me.",
      meaning_ml: "അല്ലാഹുവേ, നിന്നിൽ നിന്ന് നിന്നെ പ്രീതിപ്പെടുത്തുന്ന കാര്യങ്ങൾ എനിക്ക് എളുപ്പമാക്കിത്തരാൻ ഞാൻ നിന്നോട് ചോദിക്കുന്നു."
    }]
  },
  {
    id: 8, 
    day: "Eid Day (10 Dhul Hijjah)", 
    day_ml: "പെരുന്നാൾ ദിവസം (ദുൽഹജ്ജ് 10)",
    title: "Rami — Stoning Jamarah al-Aqabah",
    title_ml: "റംയ് — വലിയ ജംറയിലെ കല്ലേറ്",
    icon: <Icons.TargetIcon />, 
    color: "#8B4513",
    description: "Return to Mina after Muzdalifah. Stone only the large Jamarat (Jamarah al-Aqabah) with 7 pebbles after sunrise, saying 'Allahu Akbar' with each throw. Stop Talbiyah before/when stoning begins.",
    description_ml: "മുസ്ദലിഫക്ക് ശേഷം മിനായിലേക്ക് മടങ്ങുക. വലിയ ജംറയിൽ (ജംറത്തുൽ അഖബ) മാത്രം 7 കല്ലുകൾ എറിയുക. ഓരോ കല്ലെറിയുമ്പോഴും 'അല്ലാഹു അക്ബർ' എന്ന് പറയുക. കല്ലേറ് തുടങ്ങുമ്പോൾ തൽബിയത്ത് നിർത്തുക.",
    sunnah: "Stone from within the valley. Best time is after sunrise until noon.",
    sunnah_ml: "താഴ്‌വരയുടെ ഉള്ളിൽ നിന്ന് എറിയുക. ഏറ്റവും നല്ല സമയം സൂര്യോദയം മുതൽ ഉച്ച വരെയാണ്.",
    rules: "Pebbles must hit the target basin. Throwing shoes or large stones is wrong. Each pebble is thrown separately.",
    rules_ml: "കല്ലുകൾ കൃത്യമായി ജംറയുടെ തടത്തിൽ വീഴണം. ചെരിപ്പോ വലിയ കല്ലുകളോ എറിയരുത്. ഓരോ കല്ലും പ്രത്യേകമായി എറിയണം.",
    mistakes: "Throwing all pebbles at once. Throwing outside the basin. Violent throwing.",
    mistakes_ml: "എല്ലാ കല്ലുകളും ഒന്നിച്ച് എറിയുന്നത്. തടത്തിന് പുറത്ത് എറിയുന്നത്. അക്രമാസക്തമായി എറിയുന്നത്.",
    duas: [{ 
      arabic: "اللَّهُ أَكْبَرُ", 
      transliteration: "Allahu Akbar", 
      meaning: "Allah is the Greatest (said with each pebble thrown)",
      meaning_ml: "അല്ലാഹുവാണ് ഏറ്റവും വലിയവൻ"
    }]
  },
  {
    id: 9, 
    day: "10 Dhul Hijjah", 
    day_ml: "ദുൽഹജ്ജ് 10",
    title: "Hady — Animal Sacrifice",
    title_ml: "ഹദ്‌യ് — മൃഗബലി",
    icon: <Icons.GiftIcon />, 
    color: "#2d6a4f",
    description: "Perform the Hady (sacrifice of an animal). For Hajj Tamattu and Qiran, sacrifice is obligatory. For Ifrad, it is Sunnah. Modern pilgrims may purchase a sacrifice voucher through official Saudi channels (Nusuk) which ensures the meat is distributed to the poor.",
    description_ml: "ബലി കർമ്മം നിർവ്വഹിക്കുക. ഹജ്ജ് തമത്തുഅ്, ഖിറാൻ എന്നിവ ചെയ്യുന്നവർക്ക് മൃഗബലി നിർബന്ധമാണ്. ഇഫ്രാദ് ചെയ്യുന്നവർക്ക് ഇത് സുന്നത്താണ്. ഇന്നത്തെ കാലത്ത് തീർത്ഥാടകർക്ക് ഔദ്യോഗിക സൗദി ചാനലുകൾ (നുസുക്) വഴി ബലി കൂപ്പണുകൾ വാങ്ങാം, ഇത് ഇറച്ചി പാവങ്ങൾക്ക് വിതരണം ചെയ്യപ്പെടുന്നു എന്ന് ഉറപ്പാക്കുന്നു.",
    sunnah: "Recite Bismillah and say Allahu Akbar when sacrificing. Face the Qiblah.",
    sunnah_ml: "ബലി നൽകുമ്പോൾ ബിസ്മില്ലാഹ്, അല്ലാഹു അക്ബർ എന്ന് പറയുക. ഖിബ്‌ലക്ക് നേരെ തിരിയുക.",
    rules: "Animal must meet conditions: sheep (1 year+), goat (1 year+), cow/camel shared among 7.",
    rules_ml: "ബലി മൃഗത്തിന് ആവശ്യമായ യോഗ്യതകൾ ഉണ്ടായിരിക്കണം: ആട് (1 വയസ്സ് തികഞ്ഞത്), പശു/ഒട്ടകം (7 പേർക്ക് വരെ പങ്കിടാം).",
    mistakes: "Not arranging sacrifice for obligatory cases.",
    mistakes_ml: "നിർബന്ധിത സാഹചര്യങ്ങളിൽ ബലി നൽകാതിരിക്കുന്നത്.",
    duas: [{ 
      arabic: "بِسْمِ اللَّهِ، اللَّهُمَّ تَقَبَّلْ مِنِّي", 
      transliteration: "Bismillah, Allahumma taqabbal minni", 
      meaning: "In the name of Allah. O Allah, accept from me.",
      meaning_ml: "അല്ലാഹുവിന്റെ നാമത്തിൽ. അല്ലാഹുവേ, എന്നിൽ നിന്ന് ഇത് സ്വീകരിക്കേണമേ."
    }]
  },
  {
    id: 10, 
    day: "10 Dhul Hijjah", 
    day_ml: "ദുൽഹജ്ജ് 10",
    title: "Halq or Taqsir — Shaving/Cutting Hair",
    title_ml: "ഹൽഖ് അല്ലെങ്കിൽ തഖ്‌സ്വീർ — മുടി കളയൽ",
    icon: <Icons.ScissorsIcon />, 
    color: "#6c3483",
    description: "Men: shave head (Halq — preferred) or shorten hair (Taqsir). Women: cut a fingertip length from hair only — shaving is not required. After this, partial Tahallul occurs: Ihram restrictions lift EXCEPT conjugal relations.",
    description_ml: "പുരുഷന്മാർ: തലമുടി പൂർണ്ണമായി ക്ഷൗരം ചെയ്യുക (ഹൽഖ് - കൂടുതൽ ഉത്തമം) അല്ലെങ്കിൽ മുടി ചെറുതാക്കുക (തഖ്‌സ്വീർ). സ്ത്രീകൾ: വിരൽത്തുമ്പ് നീളത്തിൽ മാത്രം മുടിയുടെ അറ്റം മുറിക്കുക. ഇതോടെ ഒന്നാം തഹല്ലുൽ പൂർത്തിയാകുന്നു: ദാമ്പത്യ ബന്ധം ഒഴികെയുള്ള ഇഹ്റാമിന്റെ നിബന്ധനകൾ നീങ്ങുന്നു.",
    sunnah: "The Prophet ﷺ made dua 3 times for those who shave and once for those who shorten.",
    sunnah_ml: "തല ക്ഷൗരം ചെയ്യുന്നവർക്കായി പ്രവാചകൻ ﷺ മൂന്ന് തവണയും മുടി ചെറുതാക്കുന്നവർക്കായി ഒരു തവണയും പ്രാർത്ഥിച്ചു.",
    rules: "Must be performed in Mina or Makkah area. Do after sacrifice, before Tawaf.",
    rules_ml: "മിനായിലോ മക്കയിലോ വെച്ച് നിർവ്വഹിക്കണം. ബലിക്ക് ശേഷവും ത്വവാഫിന് മുൻപും ചെയ്യുക.",
    mistakes: "Women shaving heads — this is prohibited in Islam.",
    mistakes_ml: "സ്ത്രീകൾ തല മുണ്ഡനം ചെയ്യുന്നത് — ഇത് ഇസ്‌ലാമിൽ വിലക്കപ്പെട്ടതാണ്.",
    duas: [{ 
      arabic: "اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ", 
      transliteration: "Allahummaghfir lil-muhalliqin", 
      meaning: "O Allah, forgive those who shave their heads.",
      meaning_ml: "അല്ലാഹുവേ, തല മുണ്ഡനം ചെയ്തവർക്ക് നീ പൊറുത്തു കൊടുക്കേണമേ."
    }]
  },
  {
    id: 11, 
    day: "10 Dhul Hijjah", 
    day_ml: "ദുൽഹജ്ജ് 10",
    title: "Tawaf al-Ifadah (Tawaf of Return)",
    title_ml: "ത്വവാഫുൽ ഇഫാദ (പ്രത്യാഗമന ത്വവാഫ്)",
    icon: <Icons.KaabaIcon />, 
    color: "#1a5c3a",
    description: "This is a PILLAR (Rukn) of Hajj — mandatory. Perform 7 circuits of Tawaf around the Kaaba. After this and Sa'i, full Tahallul occurs — all Ihram restrictions are lifted including conjugal relations.",
    description_ml: "ഹജ്ജിന്റെ പ്രധാന സ്തംഭങ്ങളിൽ ഒന്നാണ് ഇത് - നിർബന്ധമാണ്. കഅ്ബക്ക് ചുറ്റും 7 തവണ ത്വവാഫ് ചെയ്യുക. ഇതിനും സഅ്‌യിനും ശേഷം പൂർണ്ണ തഹല്ലുൽ ലഭിക്കുന്നു - ദാമ്പത്യ ബന്ധം ഉൾപ്പെടെയുള്ള എല്ലാ ഇഹ്റാമിന്റെ നിബന്ധനകളും നീങ്ങുന്നു.",
    sunnah: "Pray 2 rakaat at Maqam Ibrahim after Tawaf. Drink Zamzam water.",
    sunnah_ml: "ത്വവാഫിന് ശേഷം മഖാമു ഇബ്രാഹീമിൽ വെച്ച് 2 റക്അത്ത് നമസ്കരിക്കുക. സംസം വെള്ളം കുടിക്കുക.",
    rules: "Must be in Wudu. Can be delayed until end of Tashriq days but should not be left without necessity.",
    rules_ml: "വുദൂ ഉണ്ടായിരിക്കണം. അയ്യാമുത്തശ്‌രീഖ് ദിവസങ്ങളുടെ അവസാനം വരെ ഇത് നീട്ടിവെക്കാം എങ്കിലും കാരണം കൂടാതെ നീട്ടരുത്.",
    mistakes: "Performing Tawaf without Wudu.",
    mistakes_ml: "വുദൂ ഇല്ലാതെ ത്വവാഫ് ചെയ്യുന്നത്.",
    duas: [{ 
      arabic: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", 
      transliteration: "Subhanallah, walhamdulillah, wa la ilaha illallah, wallahu akbar", 
      meaning: "Glory be to Allah, praise be to Allah, there is no god but Allah, Allah is Greatest.",
      meaning_ml: "അല്ലാഹു എത്ര പരിശുദ്ധൻ, അല്ലാഹുവിനാണ് സർവ്വ സ്തുതിയും, അല്ലാഹുവല്ലാതെ യാതൊരു ദൈവവുമില്ല, അല്ലാഹുവാണ് ഏറ്റവും വലിയവൻ."
    }]
  },
  {
    id: 12, 
    day: "11-13 Dhul Hijjah", 
    day_ml: "ദുൽഹജ്ജ് 11-13",
    title: "Tashriq Days — Staying in Mina",
    title_ml: "അയ്യാമുത്തശ്‌രീഖ് — മിനായിലെ താമസം",
    icon: <Icons.TentIcon />, 
    color: "#8a5a1a",
    description: "Stay in Mina for the Tashriq days (11th, 12th, and optionally 13th Dhul Hijjah). Stone all three Jamarat (Sughra, Wusta, Aqabah) with 7 pebbles each, after Dhuhr.",
    description_ml: "തശ്‌രീഖ് ദിവസങ്ങളിൽ (ദുൽഹജ്ജ് 11, 12, ആവശ്യമാണെങ്കിൽ 13) മിനായിൽ താമസിക്കുക. ഉച്ചക്ക് ശേഷം മൂന്ന് ജംറകളിലും (സുഗ്‌റാ, വുസ്‌ത്വാ, അഖബ) 7 വീതം കല്ലുകൾ എറിയുക.",
    sunnah: "Spend nights in Mina. Make abundant dhikr. Best time to stone is after Dhuhr until before sunset.",
    sunnah_ml: "രാത്രികൾ മിനായിൽ ചിലവഴിക്കുക. ധാരാളമായി ദിക്ർ ചൊല്ലുക. കല്ലെറിയാൻ ഏറ്റവും നല്ല സമയം ഉച്ച മുതൽ സൂര്യാസ്തമയം വരെയാണ്.",
    rules: "Stoning before Dhuhr is not valid (majority opinion). Those leaving early must stone on 11th and 12th before sunset.",
    rules_ml: "ഉച്ചക്ക് മുൻപുള്ള കല്ലേറ് സാധുവാകില്ല (ഭൂരിപക്ഷ അഭിപ്രായം). നേരത്തെ പോകുന്നവർ 12-ാം തീയതി സൂര്യാസ്തമയത്തിന് മുൻപ് കല്ലേറ് പൂർത്തിയാക്കി പോകണം.",
    mistakes: "Stoning before Dhuhr. Stoning all three Jamarat in wrong order.",
    mistakes_ml: "ഉച്ചക്ക് മുൻപ് കല്ലെറിയുന്നത്. മൂന്ന് ജംറകളിൽ ക്രമം തെറ്റി എറിയുന്നത്.",
    duas: [{ 
      arabic: "رَبَّنَا آتِنَا فِي الدُّنْИَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", 
      transliteration: "Rabbana atina fi'd-dunya hasanatan wa fi'l-akhirati hasanatan wa qina 'adhab an-nar", 
      meaning: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
      meaning_ml: "ഞങ്ങളുടെ നാഥാ, ഞങ്ങൾക്ക് ഈ ദുനിയാവിലും പരലോകത്തും നന്മ പ്രധാനം ചെയ്യേണമേ, ഞങ്ങളെ നരകശിക്ഷയിൽ നിന്ന് കാത്തുരക്ഷിക്കേണമേ."
    }]
  },
  {
    id: 13, 
    day: "Final Day", 
    day_ml: "അവസാന ദിവസം",
    title: "Tawaf al-Wada (Farewell Tawaf)",
    title_ml: "ത്വവാഫുൽ വിദാഅ് (യാത്രായയപ്പ് ത്വവാഫ്)",
    icon: <Icons.FlagIcon />, 
    color: "#2c5f8a",
    description: "The last act before leaving Makkah is Tawaf al-Wada (Farewell Tawaf) — 7 circuits around the Kaaba. Obligatory for all pilgrims except menstruating women. The Prophet ﷺ said: 'Let none of you depart until the last thing he does is Tawaf of the House.' (Muslim)",
    description_ml: "മക്കയിൽ നിന്ന് പുറപ്പെടുന്നതിന് മുൻപുള്ള അവസാന കർമ്മമാണ് ത്വവാഫുൽ വിദാഅ് - കഅ്ബക്ക് ചുറ്റും 7 തവണ വലംവെക്കുക. ആർത്തവമുള്ള സ്ത്രീകൾ ഒഴികെ എല്ലാ തീർത്ഥാടകർക്കും ഇത് നിർബന്ധമാണ്.",
    sunnah: "Leave immediately after Tawaf without sitting. Face the Kaaba at the door when leaving Masjid al-Haram.",
    sunnah_ml: "ത്വവാഫിന് ശേഷം താമസിയാതെ പുറപ്പെടുക. പള്ളിയിൽ നിന്ന് ഇറങ്ങുമ്പോൾ കഅ്ബക്ക് നേരെ തിരിഞ്ഞു പ്രാർത്ഥിക്കുക.",
    rules: "Menstruating women are excused from this Tawaf.",
    rules_ml: "ആർത്തവമുള്ള സ്ത്രീകളെ ഈ ത്വവാഫിൽ നിന്ന് ഒഴിവാക്കിയിരിക്കുന്നു.",
    mistakes: "Performing other acts after Farewell Tawaf before leaving (e.g., shopping).",
    mistakes_ml: "വിദാഅ് ത്വവാഫിന് ശേഷം മക്കയിൽ താമസിച്ച് മറ്റ് കാര്യങ്ങൾ ചെയ്യുന്നത് (ഉദാഹരണത്തിന് ഷോപ്പിംഗ്).",
    duas: [{ 
      arabic: "اللَّهُمَّ إِنَّ هَذَا البَيْتَ بَيْتُكَ، وَالحَرَمَ حَرَمُكَ، وَالأَمْنَ أَمْنُكَ، وَهَذَا مَقَامُ العَائِذِ بِكَ مِنَ النَّارِ", 
      transliteration: "Allahumma inna hadha'l-bayta baytuka wa'l-harama haramuka wa'l-amna amnuka wa hadha maqam al-'a'idhi bika min an-nar", 
      meaning: "O Allah, this House is Your House, the Sacred Precinct is Your Sacred Precinct, the security is Your security, and this is the station of one who seeks Your refuge from the Fire.",
      meaning_ml: "അല്ലാഹുവേ, ഈ ഭവനം നിന്റെ ഭവനമാണ്, ഈ ഹറം നിന്റെ ഹറമാണ്, ഈ സുരക്ഷിതത്വം നിന്റെ സുരക്ഷിതത്വമാണ്. നരകത്തിൽ നിന്ന് നിന്നോട് രക്ഷതേടുന്നവന്റെ സ്ഥാനമാണിത്."
    }]
  }
];

export const HAJJ_TYPES = [
  {
    id: "tamattu", 
    name: "Hajj al-Tamattu", 
    name_ml: "ഹജ്ജ് തമത്തുഅ്",
    arabic: "حَجُّ التَّمَتُّع",
    color: "#1a5c3a", 
    popular: true,
    description: "Performing Umrah first during the Hajj months, then releasing Ihram, then re-entering Ihram for Hajj.",
    description_ml: "ഹജ്ജ് മാസങ്ങളിൽ ആദ്യം ഉംറ നിർവ്വഹിച്ച് ഇഹ്റാമിൽ നിന്ന് ഒഴിവാകുകയും, പിന്നീട് ദുൽഹജ്ജ് 8-ന് ഹജ്ജിനായി വീണ്ടും ഇഹ്റാമിൽ പ്രവേശിക്കുകയും ചെയ്യുക.",
    who: "Most common for international pilgrims. Recommended by the Prophet ﷺ.",
    who_ml: "അന്താരാഷ്ട്ര തീർത്ഥാടകർക്ക് ഏറ്റവും സാധാരണമായത്. പ്രവാചകൻ ﷺ ശുപാർശ ചെയ്തത്.",
    advantage: "Most practical — pilgrims relax between Umrah and Hajj.",
    advantage_ml: "ഏറ്റവും പ്രായോഗികം — ഉംറക്കും ഹജ്ജിനും ഇടയിൽ തീർത്ഥാടകർക്ക് വിശ്രമിക്കാം.",
    sacrifice: "Hady (sacrifice) is OBLIGATORY.",
    sacrifice_ml: "ബലി നിർബന്ധമാണ്.",
    steps: ["Perform Umrah (Tawaf + Sa'i)", "Release Ihram", "Re-enter Ihram on 8th Dhul Hijjah", "Complete Hajj rituals"],
    steps_ml: ["ഉംറ നിർവ്വഹിക്കുക (ത്വവാഫ് + സഅ്‌യ്)", "ഇഹ്റാമിൽ നിന്ന് ഒഴിവാകുക", "ദുൽഹജ്ജ് 8-ന് വീണ്ടും ഇഹ്റാമിൽ പ്രവേശിക്കുക", "ഹജ്ജ് കർമ്മങ്ങൾ പൂർത്തിയാക്കുക"]
  },
  {
    id: "qiran", 
    name: "Hajj al-Qiran", 
    name_ml: "ഹജ്ജ് ഖിറാൻ",
    arabic: "حَجُّ القِرَان",
    color: "#8B6914", 
    popular: false,
    description: "Entering Ihram with the intention for both Umrah and Hajj together, without releasing Ihram between them.",
    description_ml: "ഉംറയും ഹജ്ജും ഒരുമിച്ച് ഉദ്ദേശിച്ച് ഇഹ്റാമിൽ പ്രവേശിക്കുകയും, രണ്ടിനും ഇടയിൽ ഇഹ്റാമിൽ നിന്ന് ഒഴിവാകാതിരിക്കുകയും ചെയ്യുക.",
    who: "Performed by those who cannot release Ihram. The Prophet ﷺ performed this.",
    who_ml: "ഇഹ്റാമിൽ നിന്ന് ഒഴിവാകാൻ സാധിക്കാത്തവർ ചെയ്യേണ്ടത്. പ്രവാചകൻ ﷺ ഇതാണ് ചെയ്തത്.",
    advantage: "Counts for both Umrah and Hajj with one Ihram.",
    advantage_ml: "ഒരു ഇഹ്റാം കൊണ്ട് ഉംറയും ഹജ്ജും ഒരുമിച്ച് ലഭിക്കുന്നു.",
    sacrifice: "Hady (sacrifice) is OBLIGATORY.",
    sacrifice_ml: "ബലി നിർബന്ധമാണ്.",
    steps: ["Enter Ihram for Umrah + Hajj together", "Perform Tawaf al-Qudum", "Sa'i (may be deferred)", "Complete Hajj without releasing Ihram"],
    steps_ml: ["ഉംറയും ഹജ്ജും ഒരുമിച്ച് കരുതി ഇഹ്റാമിൽ പ്രവേശിക്കുക", "ത്വവാഫുൽ ഖുദൂം ചെയ്യുക", "സഅ്‌യ് (പിന്നീടാകാം)", "ഇഹ്റാമിൽ നിന്ന് ഒഴിവാകാതെ ഹജ്ജ് പൂർത്തിയാക്കുക"]
  },
  {
    id: "ifrad", 
    name: "Hajj al-Ifrad", 
    name_ml: "ഹജ്ജ് ഇഫ്രാദ്",
    arabic: "حَجُّ الإِفْرَاد",
    color: "#2c5f8a", 
    popular: false,
    description: "Entering Ihram solely for Hajj, without performing Umrah. The pilgrim does not release Ihram until after completing Hajj.",
    description_ml: "ഉംറ ചെയ്യാതെ ഹജ്ജ് മാത്രം ഉദ്ദേശിച്ച് ഇഹ്റാമിൽ പ്രവേശിക്കുക. ഹജ്ജ് പൂർത്തിയാകുന്നത് വരെ ഇഹ്റാമിൽ തുടരുക.",
    who: "Those living in Makkah or nearby (within Miqat boundaries).",
    who_ml: "മക്കയിലോ അതിനടുത്തോ താമസിക്കുന്നവർ ചെയ്യുന്ന രീതി.",
    advantage: "No Hady required.",
    advantage_ml: "ബലി നിർബന്ധമില്ല.",
    sacrifice: "Hady is Sunnah (not obligatory).",
    sacrifice_ml: "ബലി സുന്നത്താണ് (നിർബന്ധമില്ല).",
    steps: ["Enter Ihram for Hajj only", "Perform Tawaf al-Qudum", "Sa'i (may be deferred)", "Complete Hajj rituals"],
    steps_ml: ["ഹജ്ജ് മാത്രം കരുതി ഇഹ്റാമിൽ പ്രവേശിക്കുക", "ത്വവാഫുൽ ഖുദൂം ചെയ്യുക", "സഅ്‌യ് (പിന്നീടാകാം)", "ഹജ്ജ് കർമ്മങ്ങൾ പൂർത്തിയാക്കുക"]
  }
];

export const ESSENTIAL_DUAS = [
  {
    id: "talbiyah", 
    category: "Ihram", 
    category_ml: "ഇഹ്റാം",
    title: "Talbiyah",
    title_ml: "തൽബിയത്ത്",
    arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
    transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, inna'l-hamda wa'n-ni'mata laka wa'l-mulk, la sharika lak",
    meaning: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace and sovereignty belong to You. You have no partner.",
    meaning_ml: "അല്ലാഹുവേ, ഞാനിതാ നിന്റെ സന്നിധിയിൽ എത്തിയിരിക്കുന്നു. ഞാനിതാ എത്തിയിരിക്കുന്നു, നിനക്ക് യാതൊരു പങ്കുകാരനുമില്ല, ഞാനിതാ എത്തിയിരിക്കുന്നു. തീർച്ചയായും സർവ്വ സ്തുതിയും അനുഗ്രഹവും പരമാധികാരവും നിനക്കുള്ളതാണ്, നിനക്ക് യാതൊരു പങ്കുകാരനുമില്ല."
  },
  {
    id: "travel", 
    category: "Travel", 
    category_ml: "യാത്ര",
    title: "Dua for Travel",
    title_ml: "യാത്രാ വേളയിലെ പ്രാർത്ഥന",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Subhana'l-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun",
    meaning: "Glory be to He Who has subjected this to us, and we could not have [otherwise] subdued it. And indeed, to our Lord we will return.",
    meaning_ml: "ഇതിനെ ഞങ്ങൾക്ക് കീഴ്പ്പെടുത്തിത്തന്നവൻ എത്ര പരിശുദ്ധൻ! ഞങ്ങൾക്ക് ഇതിനെ കീഴ്പ്പെടുത്താൻ സാധിക്കുമായിരുന്നില്ല. തീർച്ചയായും ഞങ്ങൾ ഞങ്ങളുടെ രക്ഷിതാവിലേക്ക് മടങ്ങേണ്ടവരാണ്."
  },
  {
    id: "entering-masjid", 
    category: "Masjid", 
    category_ml: "പള്ളി",
    title: "Entering Masjid al-Haram",
    title_ml: "മസ്ജിദുൽ ഹറാമിൽ പ്രവേശിക്കുമ്പോൾ",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahumma'ftah li abwaba rahmatik",
    meaning: "O Allah, open for me the doors of Your mercy.",
    meaning_ml: "അല്ലാഹുവേ, നിന്റെ കാരുണ്യത്തിന്റെ വാതിലുകൾ എനിക്ക് തുറന്നുതരേണമേ."
  },
  {
    id: "arafah", 
    category: "Arafah", 
    category_ml: "അറഫ",
    title: "Best Dua at Arafah",
    title_ml: "അറഫയിലെ ഏറ്റവും ഉത്തമമായ പ്രാർത്ഥന",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lahu, lahu'l-mulku wa lahu'l-hamdu wa huwa 'ala kulli shay'in qadir",
    meaning: "There is no god but Allah alone, with no partner. His is the sovereignty, His is the praise, and He has power over all things. (Best dhikr at Arafah — Tirmidhi)",
    meaning_ml: "അല്ലാഹുവല്ലാതെ യാതൊരു ദൈവവുമില്ല, അവൻ ഏകനാണ്, അവന് യാതൊരു പങ്കുകാരനുമില്ല. അവനാണ് പരമാധികാരവും സ്തുതിയും, അവൻ എല്ലാ കാര്യങ്ങൾക്കും കഴിവുള്ളവനാണ്."
  },
  {
    id: "safa", 
    category: "Sa'i", 
    category_ml: "സഅ്‌യ്",
    title: "Dua at Safa & Marwah",
    title_ml: "സഫാ മർവ്വ കുന്നുകളിലെ ദുആ",
    arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ",
    transliteration: "Allahu akbar, Allahu akbar, Allahu akbar, wa lillahi'l-hamd",
    meaning: "Allah is Greatest, Allah is Greatest, Allah is Greatest, and all praise belongs to Allah.",
    meaning_ml: "അല്ലാഹുവാണ് ഏറ്റവും വലിയവൻ, അല്ലാഹുവാണ് ഏറ്റവും വലിയവൻ, അല്ലാഹുവാണ് ഏറ്റവും വലിയവൻ, സർവ്വ സ്തുതിയും അല്ലാഹുവിനാണ്."
  },
  {
    id: "zamzam", 
    category: "Zamzam", 
    category_ml: "സംസം",
    title: "Dua When Drinking Zamzam",
    title_ml: "സംസം കുടിക്കുമ്പോഴുള്ള ദുആ",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمَاً نَافِعَاً، وَرِزْقَاً وَاسِعَاً، وَشِفَاءً مِنْ كُلِّ دَاءٍ",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an wa rizqan wasi'an wa shifa'an min kulli da'",
    meaning: "O Allah, I ask You for beneficial knowledge, abundant provision, and cure from every illness.",
    meaning_ml: "അല്ലാഹുവേ, പ്രയോജനപ്രദമായ അറിവും വിശാലമായ ഉപജീവനവും എല്ലാ രോഗങ്ങളിൽ നിന്നുള്ള ശമനവും ഞാൻ നിന്നോട് ചോദിക്കുന്നു."
  }
];

export const CHECKLIST = [
  {
    category: "Documents", 
    icon: <Icons.DocumentIcon />,
    items: ["Valid Passport (6+ months validity)", "Hajj Visa", "Return tickets", "Travel insurance", "Hotel booking confirmations", "Emergency contact list", "Vaccination certificates"],
    items_ml: ["പാസ്‌പോർട്ട് (കുറഞ്ഞത് 6 മാസത്തെ കാലാവധി)", "ഹജ്ജ് വിസ", "റിട്ടേൺ ടിക്കറ്റുകൾ", "യാത്രാ ഇൻഷുറൻസ്", "ഹോട്ടൽ ബുക്കിംഗ് വിവരങ്ങൾ", "അടിയന്തിര സമ്പർക്ക പട്ടിക", "വാക്സിനേഷൻ സർട്ടിഫിക്കറ്റുകൾ"]
  },
  {
    category: "Ihram Essentials", 
    icon: <Icons.BirdIcon />,
    items: ["Ihram cloth sets (2–3 for men)", "Ihram belt/safety pins", "Sandals (open-toed)", "Unscented soap", "Unscented shampoo", "Miswak", "Small scissors (for Taqsir)"],
    items_ml: ["ഇഹ്റാം വസ്ത്രങ്ങൾ (2-3 സെറ്റ്)", "ഇഹ്റാം ബെൽറ്റ് / സേഫ്റ്റി പിൻ", "തുറന്ന ചെരിപ്പുകൾ", "മണമില്ലാത്ത സോപ്പ്", "മണമില്ലാത്ത ഷാംപൂ", "മിസ്‌വാക്", "ചെറിയ കത്രിക (മുടി വെട്ടാൻ)"]
  },
  {
    category: "Clothing", 
    icon: <Icons.ShirtIcon />,
    items: ["Modest loose clothing (women)", "Comfortable walking shoes", "Light jacket/abaya", "Sun hat or umbrella", "Socks (multiple pairs)", "Change of clothes (multiple)"],
    items_ml: ["മാന്യമായ അയഞ്ഞ വസ്ത്രങ്ങൾ (സ്ത്രീകൾക്ക്)", "നടക്കാൻ സുഖപ്രദമായ ചെരിപ്പുകൾ", "കനം കുറഞ്ഞ ജാക്കറ്റ് / അബായ", "തൊപ്പി അല്ലെങ്കിൽ കുട", "സോക്സുകൾ (പല ജോടി)", "മാറി ധരിക്കാനുള്ള വസ്ത്രങ്ങൾ"]
  },
  {
    category: "Medicines", 
    icon: <Icons.PillIcon />,
    items: ["Personal prescription medicines", "Paracetamol/Pain relief", "Oral rehydration salts", "Antiseptic cream", "Blister plasters", "Antidiarrheal tablets", "Throat lozenges", "Sunscreen SPF 50+"],
    items_ml: ["വ്യക്തിഗത കുറിപ്പടി മരുന്നുകൾ", "വേദനസംഹാരികൾ (Paracetamol)", "ഒ.ആർ.എസ് (ORS) പാക്കറ്റുകൾ", "ആന്റിസെപ്റ്റിക് ക്രീം", "ബ്ലിസ്റ്റർ പ്ലാസ്റ്ററുകൾ", "വയറിളക്കത്തിനുള്ള മരുന്നുകൾ", "തൊണ്ടവേദനക്കുള്ള ഗുളികകൾ", "സൺസ്‌ക്രീൻ ക്രീം (SPF 50+)"]
  },
  {
    category: "Spiritual Items", 
    icon: <Icons.BeadsIcon />,
    items: ["Quran (pocket size)", "Duas booklet", "Tasbeeh counter", "Prayer mat", "Prayer times app installed", "Memorized key duas"],
    items_ml: ["ചെറിയ ഖുർആൻ കോപ്പി", "പ്രാർത്ഥന പുസ്തകം", "തസ്ബീഹ് കൗണ്ടർ", "മുസല്ല (നമസ്കാരപ്പായ)", "പ്രാർത്ഥനാ സമയ ആപ്പ്", "പ്രധാന പ്രാർത്ഥനകൾ പഠിക്കൽ"]
  },
  {
    category: "Electronics", 
    icon: <Icons.PhoneIcon />,
    items: ["Mobile phone + charger", "Power bank", "Universal adapter", "Earphones", "GPS or offline maps", "Emergency cash (SAR)"],
    items_ml: ["മൊബൈൽ ഫോണും ചാർജറും", "പവർ ബാങ്ക്", "യൂണിവേഴ്സൽ അഡാപ്റ്റർ", "ഇയർഫോൺ", "ഓഫ്‌ലൈൻ മാപ്പുകൾ", "അടിയന്തിര ആവശ്യങ്ങൾക്കുള്ള പണം (SAR)"]
  }
];

export const COMMON_MISTAKES = [
  { 
    icon: <Icons.WarningIcon />, 
    title: "Incorrect Ihram", 
    title_ml: "തെറ്റായ ഇഹ്റാം രീതി",
    desc: "Men wearing sewn garments, applying perfume on Ihram cloth, or covering head. Women shaving their heads.",
    desc_ml: "പുരുഷന്മാർ തുന്നിയ വസ്ത്രങ്ങൾ ധരിക്കുകയോ, ഇഹ്റാം വസ്ത്രത്തിൽ അത്തർ പുരട്ടുകയോ, തല മറയ്ക്കുകയോ ചെയ്യുക. സ്ത്രീകൾ തല മുണ്ഡനം ചെയ്യുക."
  },
  { 
    icon: <Icons.RunIcon />, 
    title: "Leaving Arafah Early", 
    title_ml: "അറഫയിൽ നിന്ന് നേരത്തെ പോകൽ",
    desc: "Departing Arafah before sunset on the 9th is a major error that may invalidate Hajj.",
    desc_ml: "ദുൽഹജ്ജ് 9-ന് സൂര്യാസ്തമയത്തിന് മുൻപായി അറഫ വിടുന്നത് ഹജ്ജ് നഷ്ടപ്പെടാൻ കാരണമായേക്കാവുന്ന വലിയ തെറ്റാണ്."
  },
  { 
    icon: <Icons.ClockIcon />, 
    title: "Wrong Jamarat Timing", 
    title_ml: "തെറ്റായ കല്ലേറ് സമയം",
    desc: "Stoning Jamarat before Dhuhr on Tashriq days is invalid according to the majority of scholars.",
    desc_ml: "അയ്യാമുത്തശ്‌രീഖ് ദിവസങ്ങളിൽ ഉച്ചക്ക് (ളുഹ്ർ) മുൻപായി കല്ലെറിയുന്നത് ഭൂരിഭാഗം പണ്ഡിതന്മാരുടെയും അഭിപ്രായത്തിൽ സാധുവാകില്ല."
  },
  { 
    icon: <Icons.DiamondIcon />, 
    title: "Incorrect Stoning", 
    title_ml: "തെറ്റായ കല്ലേറ് രീതി",
    desc: "Throwing shoes, stones, or large objects. Throwing all pebbles at once instead of one by one.",
    desc_ml: "ചെരിപ്പുകളോ വലിയ കല്ലുകളോ എറിയുന്നത്. കല്ലുകൾ ഓരോന്നായി എറിയുന്നതിന് പകരം ഒരുമിച്ച് എറിയുന്നത്."
  },
  { 
    icon: <Icons.FaceIcon />, 
    title: "Arguments & Impatience", 
    title_ml: "തർക്കങ്ങളും അക്ഷമയും",
    desc: "The Quran explicitly forbids arguments, obscenity, and immorality during Hajj (2:197).",
    desc_ml: "ഹജ്ജിന്റെ വേളയിൽ തർക്കങ്ങളിൽ ഏർപ്പെടുന്നതും മോശം സംസാരങ്ങളും ഖുർആൻ കർശനമായി വിലക്കിയിരിക്കുന്നു (2:197)."
  },
  { 
    icon: <Icons.DropIcon />, 
    title: "Dehydration", 
    title_ml: "ശരീരത്തിൽ ജലാംശം കുറയൽ",
    desc: "Not drinking enough water in Makkah's intense heat. Always carry Zamzam water.",
    desc_ml: "കടുത്ത ചൂടിൽ ആവശ്യത്തിന് വെള്ളം കുടിക്കാതിരിക്കുന്നത്. എപ്പോഴും സംസം വെള്ളം കയ്യിൽ കരുതുക."
  },
  { 
    icon: <Icons.PhoneIcon />, 
    title: "Phone Distraction", 
    title_ml: "മൊബൈൽ ഫോൺ ഉപയോഗം",
    desc: "Excessive photography instead of focus on worship, especially at Arafah.",
    desc_ml: "അറഫ പോലെയുള്ള പ്രധാന ഘട്ടങ്ങളിൽ ആരാധനയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുന്നതിന് പകരം അമിതമായി ഫോട്ടോകളും സെൽഫികളും എടുക്കുന്നത്."
  },
  { 
    icon: <Icons.MapIcon />, 
    title: "Getting Lost", 
    title_ml: "വഴി തെറ്റിപ്പോകൽ",
    desc: "Not memorizing your group's flag, bus number, and hotel address before going out.",
    desc_ml: "നിങ്ങളുടെ ഹജ്ജ് ഗ്രൂപ്പിന്റെ കൊടി, ബസ് നമ്പർ, ഹോട്ടൽ വിലാസം എന്നിവ മുൻകൂട്ടി മനസ്സിലാക്കാതിരിക്കുന്നത്."
  }
];

export const WOMENS_GUIDANCE = [
  { 
    title: "Ihram for Women", 
    title_ml: "സ്ത്രീകളുടെ ഇഹ്റാം",
    content: "Women wear regular modest clothing covering entire body except face and hands. No specific white garments required. Women should not cover their faces with Niqab while in Ihram (in most scholars' opinion) though this is debated.",
    content_ml: "സ്ത്രീകൾക്ക് പ്രത്യേക ഇഹ്റാം വസ്ത്രമില്ല, സാധാരണ മാന്യമായ അയഞ്ഞ വസ്ത്രം ധരിക്കാം. ഇഹ്റാമിന്റെ വേളയിൽ സ്ത്രീകൾ മുഖവും കൈപ്പത്തിയും മറയ്ക്കാൻ പാടില്ല എന്നാണ് ഭൂരിഭാഗം പണ്ഡിതന്മാരും അഭിപ്രായപ്പെടുന്നത്."
  },
  { 
    title: "Menstruation & Hajj", 
    title_ml: "ആർത്തവവും ഹജ്ജും",
    content: "A woman who starts her period during Hajj can perform all rituals EXCEPT Tawaf. She should wait until she is purified for Tawaf al-Ifadah. If she must travel, most contemporary scholars (including Saudi scholars) permit Tawaf al-Wada to be skipped without expiation.",
    content_ml: "ഹജ്ജിന്റെ സമയത്ത് ആർത്തവമുണ്ടാകുന്ന സ്ത്രീകൾക്ക് ത്വവാഫ് ഒഴികെയുള്ള മറ്റെല്ലാ ഹജ്ജ് കർമ്മങ്ങളും നിർവ്വഹിക്കാം. ത്വവാഫുൽ ഇഫാദക്കായി അവർ ശുദ്ധിയാകുന്നത് വരെ കാത്തിരിക്കണം. മടക്കയാത്ര ഉടനെ വേണമെങ്കിൽ യാത്രായയപ്പ് ത്വവാഫ് (ത്വവാഫുൽ വിദാഅ്) ചെയ്യാതെ അവർക്ക് മടങ്ങാം."
  },
  { 
    title: "Hair Trimming", 
    title_ml: "മുടി വെട്ടൽ",
    content: "Women shorten hair by cutting a fingertip-length from the ends — shaving is not permitted for women in Islam.",
    content_ml: "സ്ത്രീകൾ തലമുടി പൂർണ്ണമായി ക്ഷൗരം ചെയ്യാൻ പാടില്ല. മുടിയുടെ അറ്റത്ത് നിന്ന് ഒരു വിരൽത്തുമ്പ് നീളത്തിൽ മാത്രം മുറിക്കുക."
  },
  { 
    title: "Mahram Requirement", 
    title_ml: "മഹ്റം നിബന്ധന",
    content: "Women must travel with a Mahram (close male relative: husband, father, brother, son). Saudi Arabia currently allows women 45+ to travel in an organized group without Mahram (regulations may change — verify with official Nusuk platform).",
    content_ml: "സ്ത്രീകൾ ഹജ്ജ് ചെയ്യുമ്പോൾ കൂടെ മഹ്റം (ഭർത്താവ്, പിതാവ്, സഹോദരൻ, മകൻ തുടങ്ങിയ അടുത്ത രക്തബന്ധമുള്ള പുരുഷൻ) ഉണ്ടായിരിക്കണം. സൗദി അറേബ്യയുടെ പുതിയ നിയമപ്രകാരം നിശ്ചിത പ്രായമുള്ള സ്ത്രീകൾക്ക് വിശ്വസനീയമായ ഗ്രൂപ്പുകൾക്കൊപ്പം യാത്ര ചെയ്യാൻ അനുമതിയുണ്ട്."
  },
  { 
    title: "Pregnancy", 
    title_ml: "ഗർഭാവസ്ഥ",
    content: "Consult a physician before Hajj if pregnant. There is no Islamic prohibition, but the physical demands require medical evaluation. Many scholars recommend postponing if in advanced pregnancy.",
    content_ml: "ഗർഭിണിയാണെങ്കിൽ ഹജ്ജിന് പുറപ്പെടുന്നതിന് മുൻപായി ഡോക്ടറുടെ ഉപദേശം തേടുക. ശാരീരിക ബുദ്ധിമുട്ടുകൾ കണക്കിലെടുത്ത് കഠിനമായ സാഹചര്യങ്ങൾ ഒഴിവാക്കാൻ പണ്ഡിതന്മാർ നിർദ്ദേശിക്കുന്നു."
  },
  { 
    title: "Safety Tips", 
    title_ml: "സുരക്ഷാ നിർദ്ദേശങ്ങൾ",
    content: "Stay with your group. Have your hotel address and Mahram's number memorized. Carry identification. Use the women's area in Masjid al-Haram. Travel during cooler hours when possible.",
    content_ml: "എപ്പോഴും നിങ്ങളുടെ ഹജ്ജ് ഗ്രൂപ്പിനൊപ്പം സഞ്ചരിക്കുക. നിങ്ങളുടെ ഹോട്ടൽ വിലാസവും മഹ്റമിന്റെ നമ്പറും കൈവശം സൂക്ഷിക്കുക. തിരക്ക് കുറഞ്ഞ സമയങ്ങളിൽ മാത്രം കർമ്മങ്ങൾ ചെയ്യാൻ ശ്രദ്ധിക്കുക."
  }
];
