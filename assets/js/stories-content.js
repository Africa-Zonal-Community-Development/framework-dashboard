/* Stories of change content — from "Consolidated Assessment of 24 Stories, 2026".
   Shared by stories.html and summary.html. Edit the wording here. */
(function () {
  'use strict';
  var STORY = {
    tamela: 'Tamela Kidawenda (disability inclusion)',
    tnz: 'Tanzania community project (CD24 TNZ)',
    wambura: 'Wambura',
    all: 'Consolidated stories, 2026'
  };
  var SO = {
    P: { name: 'Goal & Purpose', l: '#B1CBDA' }, '1': { name: 'Outcome 1 · Education', l: '#FFE699' },
    '2': { name: 'Outcome 2 · Health & WASH', l: '#F8CCAF' }, '3': { name: 'Outcome 3 · Economic inclusion', l: '#E5B5CB' },
    '4': { name: 'Outcome 4 · Safe environments', l: '#C4DFB4' }
  };
  var ICON = {
    chart: '<path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V9"/><path d="M17 16V5"/><path d="M5 9l5-4 4 3 5-5"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    book: '<path d="M2 5c3-1 7-1 10 1 3-2 7-2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1z"/><path d="M12 6v14"/>',
    people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 15c3 0 6 2 6 5"/>',
    drop: '<path d="M12 3c3 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6.5 6-11z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M8 9h8"/><path d="M12 9v6"/><path d="M12 15l-3 6"/><path d="M12 15l3 6"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19L14 10"/>'
  };
  var PW = [
    { id: 1, name: 'Economic empowerment', icon: 'chart', inputs: ['Vocational skills', 'Enterprise support', 'Agricultural training'],
      chain: ['Skills and resources', 'Income and business growth', 'Greater self-reliance'],
      desc: 'Livelihood support, vocational skills, entrepreneurship and agricultural training enabled people to earn income, accumulate assets, improve housing and become increasingly self-reliant.',
      ind: ['1.3', '1.2.2', '3.2.1', '3.5'], so: '3', stories: ['all', 'wambura'] },
    { id: 2, name: 'Financial inclusion', icon: 'coins', inputs: ['VSLAs', 'Savings groups', 'Financial literacy', 'Formal finance'],
      chain: ['Savings and access to credit', 'Investment and asset building', 'Financial resilience'],
      desc: 'Village Savings and Loan Associations, savings groups and access to credit let people save regularly, borrow affordably and invest in businesses, farming, livestock and housing — and cope better with shocks.',
      ind: ['3.2.2', '3.2.1', '3.5'], so: '3', stories: ['tnz', 'wambura'] },
    { id: 3, name: 'Education & learning', icon: 'book', inputs: ['School access', 'Sponsorship', 'Literacy', 'Vocational training'],
      chain: ['Learning and achievement', 'Confidence and aspirations', 'Expanded future opportunities'],
      desc: 'Education support was one of the strongest pathways. Improved literacy, achievement and employable skills led to greater self-belief, professional ambitions and wider life prospects.',
      ind: ['1.1.1', '1.1.2', '1.1.4', '1.1.5', '1.2.1'], so: '1', stories: ['tamela', 'all'] },
    { id: 4, name: 'Social support & inclusion', icon: 'people', inputs: ['Peer support', 'Mentoring', 'Community groups', 'Sport'],
      chain: ['Belonging and confidence', 'Positive choices and participation', 'Inclusion and leadership'],
      desc: 'Community groups, sports programmes, mentoring and collective action strengthened belonging, confidence, positive decision-making and community leadership.',
      ind: ['04', '03', '4.1.5'], so: 'P', stories: ['all'] },
    { id: 5, name: 'Essential services', icon: 'drop', inputs: ['Water', 'Sanitation', 'Nutrition', 'Safe living conditions'],
      chain: ['Better health and time savings', 'Dignity and productivity', 'Improved wellbeing'],
      desc: 'Access to clean water, sanitation, nutrition, irrigation and safe living conditions improved health, saved time, enhanced dignity and raised productivity — a foundation for wider change.',
      ind: ['2.2.1b', '2.2.2b', '2.2.3', '2.2-water', '2.1.1'], so: '2', stories: ['all', 'tnz'] },
    { id: 6, name: 'Protection & care', icon: 'shield', inputs: ['Protection services', 'Counselling', 'Reintegration', 'Child sponsorship'],
      chain: ['Safety and recovery', 'Agency and empowerment', 'Renewed hope and opportunity'],
      desc: 'Counselling, child protection, sponsorship and reintegration support helped vulnerable children, street-connected youth and survivors of exploitation recover, return to learning or work, and plan positive futures.',
      ind: ['4.1.4', '4.2.4', '4.1.1', '4.2.7'], so: '4', stories: ['all'] },
    { id: 7, name: 'Disability inclusion', icon: 'access', inputs: ['Inclusive education', 'Tailored support', 'Sport'],
      chain: ['Accessible learning and participation', 'Skills and confidence', 'Greater inclusion and aspirations'],
      desc: 'Specialised education and inclusive support enabled children living with disabilities to build confidence, develop their talents, take full part in school life and pursue ambitious goals.',
      ind: [], gap: 'No framework indicator measures disability inclusion directly yet, although it emerged strongly in the latest stories. Consider adding one (for example, # of learners with disabilities supported in TSA schools).',
      so: '1', stories: ['tamela'] },
    { id: 8, name: 'Resilient livelihoods', icon: 'leaf', inputs: ['Livestock', 'Climate-smart farming', 'Nutrition gardens'],
      chain: ['Improved production and nutrition', 'Income diversification and assets', 'Food security and household resilience'],
      desc: 'Livestock support, sustainable agriculture, kitchen gardens and better farming practices raised production, strengthened food security, generated income and improved resilience to shocks.',
      ind: ['3.1.2', '3.4', '3.1.3', '3.2', '3.3.1'], so: '3', stories: ['tnz', 'wambura'] }
  ];
  var THEMES = [
    { t: 'Economic empowerment and livelihood development', short: 'Livelihoods, skills, farming and enterprise raised incomes, built assets and strengthened financial security.', so: '3', pw: [1, 8], stories: ['all', 'tnz', 'wambura'],
      body: 'Livelihood support, vocational training, agricultural development, entrepreneurship, savings groups and livestock initiatives raised incomes, built assets, diversified livelihoods, improved housing and strengthened financial security. Participants moved from economic uncertainty to greater self-reliance.' },
    { t: 'Education, skills development and future opportunities', short: 'One of the strongest pathways: better learning, employable skills, confidence and ambition, including for children living with disabilities.', so: '1', pw: [3, 7], stories: ['all', 'tamela', 'wambura'],
      body: 'One of the strongest pathways. Stories show better literacy, achievement, vocational skills, employability, confidence and aspirations, with participants moving from exclusion or limited options to higher attainment and professional ambitions. Tamela Kidawenda’s story shows how inclusive education unlocks the potential of children living with disabilities.' },
    { t: 'Financial inclusion and asset building', short: 'Savings groups, VSLAs and formal finance let people save, borrow affordably, invest and absorb shocks.', so: '3', pw: [2], stories: ['tnz', 'wambura'],
      body: 'Savings groups, VSLAs, financial literacy and formal financial services let people save, borrow affordably, invest in productive assets, build businesses and absorb shocks. Several moved from little or no financial security to running thriving enterprises.' },
    { t: 'Health, food security and access to essential services', short: 'Water, sanitation, nutrition and better farming improved health, productivity and dignity, a foundation for wider change.', so: '2', pw: [5, 8], stories: ['all', 'tnz', 'wambura'],
      body: 'Clean water, sanitation, nutrition support, irrigation, kitchen gardens and improved farming led to better health and nutrition, less vulnerability to food shortages, higher productivity, and greater dignity. Basic services laid the foundation for wider economic and social change.' },
    { t: 'Social inclusion, disability inclusion and participation', short: 'Groups, mentoring, sport and disability-inclusive services built belonging, participation and leadership.', so: 'P', pw: [4, 7], stories: ['tamela'],
      body: 'Community groups, peer support, mentoring, sport, education initiatives and disability-inclusive services strengthened confidence, belonging, participation and leadership. Specialised support removed barriers so people could take full part in education, recreation and community life.' },
    { t: 'Protection, recovery and empowerment', short: 'Counselling, protection and reintegration helped children, youth and survivors of exploitation recover and move forward.', so: '4', pw: [6], stories: ['all'],
      body: 'Protection services, counselling, child sponsorship, reintegration and community initiatives helped vulnerable children, street-connected youth and survivors of exploitation recover, regain confidence and pursue education and livelihoods.' }
  ];
  // word, emphasis (1–5), colour, pathways it belongs to
  var WORDS = [
    ['Education', 4, '#D45A12', [3, 7]], ['Confidence', 3, '#1B3F8B', [3, 4, 7]], ['Opportunity', 3, '#0B7B8A', [3, 6]],
    ['Empowerment', 3, '#C8174B', [1, 6]], ['Resilience', 5, '#0B6F80', [1, 2, 8]], ['Belonging', 2, '#2E7D32', [4]],
    ['Inclusion', 3, '#6A2DA8', [4, 7]], ['Employment', 2, '#1B3F8B', [1, 3]], ['Livelihood security', 3, '#2E7D32', [1, 8]],
    ['Wellbeing', 4, '#6A2DA8', [5]], ['Disability inclusion', 2, '#6A2DA8', [7]], ['Income', 3, '#1565C0', [1, 8]],
    ['Hope', 5, '#C8174B', [1, 2, 3, 4, 5, 6, 7, 8]], ['Literacy', 2, '#2E7D32', [3]], ['Health', 3, '#2E7D32', [5]],
    ['Savings', 3, '#D45A12', [2]], ['Learning', 2, '#D45A12', [3]], ['Self-reliance', 3, '#1565C0', [1]],
    ['Dignity', 5, '#3C8A2E', [5, 6]], ['Food security', 3, '#D45A12', [8, 5]], ['Participation', 2, '#C8174B', [4, 7]],
    ['Financial security', 2, '#1B3F8B', [2]], ['Career aspirations', 1, '#1565C0', [3, 7]], ['Improved nutrition', 1, '#0B7B8A', [5, 8]],
    ["Women's empowerment", 1, '#B85A00', [1, 2]], ['Asset building', 1, '#6A2DA8', [2, 8]], ['Time savings', 1, '#0B7B8A', [5]],
    ['Entrepreneurship', 1, '#B85A00', [1, 2]], ['Better housing', 1, '#1B3F8B', [1, 2]], ['Safety', 1, '#C8174B', [6]],
    ['Positive choices', 1, '#2E7D32', [4]], ['Productivity', 1, '#1565C0', [5, 8]], ['Recovery', 1, '#2E7D32', [6]],
    ['Social support', 1, '#C8174B', [4]], ['Community leadership', 1, '#6A2DA8', [4]], ['Future opportunities', 1, '#1565C0', [3, 6]]
  ];
  var NEW_THEMES = ['Disability inclusion', 'Livestock development', "Women's economic empowerment", 'Agricultural commercialisation', 'Formal financial access', 'Sports participation', 'Career aspirations', 'Community leadership'];
  var ROLES = [['🧑‍💼', 'Entrepreneurs'], ['🛠️', 'Skilled workers'], ['🌾', 'Farmers'], ['💰', 'Savers'], ['🗣️', 'Community leaders'], ['🤝', 'Peer educators'], ['📣', 'Advocates'], ['⭐', 'Role models']];

  window.AZF_STORIES = { STORY: STORY, SO: SO, ICON: ICON, PW: PW, THEMES: THEMES, WORDS: WORDS, NEW_THEMES: NEW_THEMES, ROLES: ROLES };
})();
