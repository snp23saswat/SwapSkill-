/**
 * Predefined skills grouped by category.
 * Each skill has a canonical `key` (lowercase, normalized) and a `label` (display name).
 *
 * The aliasMap at the bottom normalizes common variants to canonical keys.
 */

const skillCategories = [
  {
    category: 'Programming',
    skills: [
      { key: 'javascript', label: 'JavaScript' },
      { key: 'python', label: 'Python' },
      { key: 'java', label: 'Java' },
      { key: 'c++', label: 'C++' },
      { key: 'c', label: 'C' },
      { key: 'typescript', label: 'TypeScript' },
      { key: 'react', label: 'React' },
      { key: 'angular', label: 'Angular' },
      { key: 'vue', label: 'Vue.js' },
      { key: 'node.js', label: 'Node.js' },
      { key: 'express', label: 'Express.js' },
      { key: 'mongodb', label: 'MongoDB' },
      { key: 'sql', label: 'SQL' },
      { key: 'html/css', label: 'HTML/CSS' },
      { key: 'git', label: 'Git & GitHub' },
      { key: 'data structures', label: 'Data Structures & Algorithms' },
      { key: 'machine learning', label: 'Machine Learning' },
      { key: 'flutter', label: 'Flutter' },
      { key: 'react native', label: 'React Native' },
      { key: 'django', label: 'Django' },
      { key: 'ruby', label: 'Ruby' },
      { key: 'go', label: 'Go' },
      { key: 'rust', label: 'Rust' },
      { key: 'docker', label: 'Docker' },
      { key: 'aws', label: 'AWS' },
    ],
  },
  {
    category: 'Design',
    skills: [
      { key: 'figma', label: 'Figma' },
      { key: 'ui/ux design', label: 'UI/UX Design' },
      { key: 'photoshop', label: 'Photoshop' },
      { key: 'illustrator', label: 'Illustrator' },
      { key: 'canva', label: 'Canva' },
      { key: 'graphic design', label: 'Graphic Design' },
      { key: '3d modeling', label: '3D Modeling' },
      { key: 'animation', label: 'Animation' },
    ],
  },
  {
    category: 'Music',
    skills: [
      { key: 'guitar', label: 'Guitar' },
      { key: 'piano', label: 'Piano' },
      { key: 'drums', label: 'Drums' },
      { key: 'singing', label: 'Singing/Vocals' },
      { key: 'music production', label: 'Music Production' },
      { key: 'music theory', label: 'Music Theory' },
      { key: 'tabla', label: 'Tabla' },
      { key: 'violin', label: 'Violin' },
    ],
  },
  {
    category: 'Languages',
    skills: [
      { key: 'english', label: 'English' },
      { key: 'hindi', label: 'Hindi' },
      { key: 'spanish', label: 'Spanish' },
      { key: 'french', label: 'French' },
      { key: 'german', label: 'German' },
      { key: 'japanese', label: 'Japanese' },
      { key: 'korean', label: 'Korean' },
      { key: 'mandarin', label: 'Mandarin Chinese' },
    ],
  },
  {
    category: 'Academics',
    skills: [
      { key: 'mathematics', label: 'Mathematics' },
      { key: 'physics', label: 'Physics' },
      { key: 'chemistry', label: 'Chemistry' },
      { key: 'biology', label: 'Biology' },
      { key: 'statistics', label: 'Statistics' },
      { key: 'economics', label: 'Economics' },
      { key: 'accounting', label: 'Accounting' },
      { key: 'english literature', label: 'English Literature' },
    ],
  },
  {
    category: 'Creative',
    skills: [
      { key: 'photography', label: 'Photography' },
      { key: 'video editing', label: 'Video Editing' },
      { key: 'content writing', label: 'Content Writing' },
      { key: 'creative writing', label: 'Creative Writing' },
      { key: 'blogging', label: 'Blogging' },
      { key: 'public speaking', label: 'Public Speaking' },
      { key: 'podcasting', label: 'Podcasting' },
      { key: 'drawing', label: 'Drawing & Sketching' },
    ],
  },
  {
    category: 'Life Skills',
    skills: [
      { key: 'cooking', label: 'Cooking' },
      { key: 'fitness training', label: 'Fitness Training' },
      { key: 'yoga', label: 'Yoga' },
      { key: 'meditation', label: 'Meditation' },
      { key: 'financial literacy', label: 'Financial Literacy' },
      { key: 'time management', label: 'Time Management' },
      { key: 'communication skills', label: 'Communication Skills' },
      { key: 'leadership', label: 'Leadership' },
    ],
  },
];

/**
 * Alias map: maps common variants/abbreviations to canonical skill keys.
 * All alias keys should be lowercase and trimmed.
 */
const aliasMap = {
  // Programming
  js: 'javascript',
  'java script': 'javascript',
  py: 'python',
  'c plus plus': 'c++',
  cpp: 'c++',
  ts: 'typescript',
  reactjs: 'react',
  'react.js': 'react',
  'react js': 'react',
  angularjs: 'angular',
  'angular.js': 'angular',
  'angular js': 'angular',
  vuejs: 'vue',
  'vue.js': 'vue',
  'vue js': 'vue',
  nodejs: 'node.js',
  'node js': 'node.js',
  node: 'node.js',
  expressjs: 'express',
  'express.js': 'express',
  'express js': 'express',
  mongo: 'mongodb',
  html: 'html/css',
  css: 'html/css',
  'html css': 'html/css',
  github: 'git',
  dsa: 'data structures',
  'data structures and algorithms': 'data structures',
  'ds & algo': 'data structures',
  ml: 'machine learning',
  ai: 'machine learning',
  'artificial intelligence': 'machine learning',
  'react native js': 'react native',
  golang: 'go',

  // Design
  'ui ux': 'ui/ux design',
  'ui/ux': 'ui/ux design',
  ux: 'ui/ux design',
  'ux design': 'ui/ux design',
  'user experience': 'ui/ux design',
  ps: 'photoshop',
  'adobe photoshop': 'photoshop',
  'adobe illustrator': 'illustrator',
  '3d': '3d modeling',

  // Music
  vocals: 'singing',
  vocal: 'singing',
  'music prod': 'music production',

  // Languages
  chinese: 'mandarin',
  'mandarin chinese': 'mandarin',

  // Academics
  maths: 'mathematics',
  math: 'mathematics',
  stats: 'statistics',
  econ: 'economics',
  'eng lit': 'english literature',

  // Creative
  'photo': 'photography',
  'video edit': 'video editing',
  'content write': 'content writing',
  writing: 'creative writing',
  'public speak': 'public speaking',
  drawing: 'drawing',
  sketching: 'drawing',

  // Life Skills
  'fitness': 'fitness training',
  'gym': 'fitness training',
  'workout': 'fitness training',
  cook: 'cooking',
  finance: 'financial literacy',
  'money management': 'financial literacy',
  'time mgmt': 'time management',
  'comm skills': 'communication skills',
};

// Build a flat lookup: key -> { key, label, category }
const skillLookup = {};
for (const cat of skillCategories) {
  for (const s of cat.skills) {
    skillLookup[s.key] = { key: s.key, label: s.label, category: cat.category };
  }
}

module.exports = { skillCategories, aliasMap, skillLookup };
