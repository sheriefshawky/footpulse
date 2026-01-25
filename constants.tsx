
import { SurveyTemplate, UserRole, User } from './types';

export const INITIAL_TEMPLATES: SurveyTemplate[] = [
  {
    id: 't-trainer-eval',
    name: "Trainer's Monthly Player Evaluation",
    arName: "تقييم المدرب الشهري للاعب",
    description: "Comprehensive performance review covering technical, physical, and behavioral metrics.",
    arDescription: "مراجعة شاملة للأداء تغطي المقاييس الفنية والبدنية والسلوكية.",
    categories: [
      {
        id: 'c-tech',
        name: 'Technical Proficiency',
        arName: 'الكفاءة الفنية',
        weight: 30,
        questions: [
          // Added missing type property
          { id: 'q-tech-1', text: 'Ball Control & First Touch', arText: 'التحكم بالكرة واللمسة الأولى', weight: 34, type: 'RATING' },
          { id: 'q-tech-2', text: 'Passing Accuracy & Vision', arText: 'دقة التمرير والرؤية', weight: 33, type: 'RATING' },
          { id: 'q-tech-3', text: 'Shooting & Finishing Efficiency', arText: 'كفاءة التسديد والإنهاء', weight: 33, type: 'RATING' }
        ]
      },
      {
        id: 'c-phys',
        name: 'Physical Conditioning',
        arName: 'اللياقة البدنية',
        weight: 30,
        questions: [
          // Added missing type property
          { id: 'q-phys-1', text: 'Match Fitness & Stamina', arText: 'لياقة المباراة والتحمل', weight: 40, type: 'RATING' },
          { id: 'q-phys-2', text: 'Speed & Acceleration', arText: 'السرعة والتسارع', weight: 30, type: 'RATING' },
          { id: 'q-phys-3', text: 'Strength & Physical Duels', arText: 'القوة والتحام البدني', weight: 30, type: 'RATING' }
        ]
      },
      {
        id: 'c-behav',
        name: 'Tactical & Behavioral',
        arName: 'التكتيكي والسلوكي',
        weight: 40,
        questions: [
          // Added missing type property
          { id: 'q-behav-1', text: 'Positioning & Tactical Awareness', arText: 'التمركز والوعي التكتيكي', weight: 40, type: 'RATING' },
          { id: 'q-behav-2', text: 'Work Rate & Team Spirit', arText: 'معدل العمل وروح الفريق', weight: 30, type: 'RATING' },
          { id: 'q-behav-3', text: 'Discipline & Punctuality', arText: 'الانضباط والالتزام بالوقت', weight: 30, type: 'RATING' }
        ]
      }
    ]
  },
  {
    id: 't-player-self',
    name: 'Player Monthly Self-Assessment',
    arName: 'التقييم الذاتي الشهري للاعب',
    description: 'Reflect on your own progress and motivation levels this month.',
    arDescription: 'تأمل في تقدمك ومستويات تحفيزك هذا الشهر.',
    categories: [
      {
        id: 'c-self-effort',
        name: 'Effort & Mindset',
        arName: 'الجهد والعقلية',
        weight: 100,
        questions: [
          // Added missing type property
          { id: 'q-self-1', text: 'I am satisfied with my training effort', arText: 'أنا راضٍ عن جهدي في التدريب', weight: 50, type: 'RATING' },
          { id: 'q-self-2', text: 'I feel motivated to improve my skills', arText: 'أشعر بالتحفيز لتحسين مهاراتي', weight: 50, type: 'RATING' }
        ]
      }
    ]
  },
  {
    id: 't-coach-eval',
    name: 'Trainer Assessment Survey',
    arName: 'استبيان تقييم المدرب',
    description: 'Provide feedback on your coach performance and training quality.',
    arDescription: 'قدم ملاحظاتك حول أداء مدربك وجودة التدريب.',
    categories: [
      {
        id: 'c-coach-quality',
        name: 'Coaching Quality',
        arName: 'جودة التدريب',
        weight: 100,
        questions: [
          // Added missing type property
          { id: 'q-ce-1', text: 'Clarity of coaching instructions', arText: 'وضوح تعليمات التدريب', weight: 40, type: 'RATING' },
          { id: 'q-ce-2', text: 'Personal feedback received from coach', arText: 'الملاحظات الشخصية المستلمة من المدرب', weight: 30, type: 'RATING' },
          { id: 'q-ce-3', text: 'Level of support and encouragement', arText: 'مستوى الدعم والتشجيع', weight: 30, type: 'RATING' }
        ]
      }
    ]
  },
  {
    id: 't-guardian-feedback',
    name: 'Guardian Feedback Survey',
    arName: 'استبيان ملاحظات ولي الأمر',
    description: 'Help the academy improve the training environment and logistics.',
    arDescription: 'ساعد الأكاديمية في تحسين بيئة التدريب واللوجستيات.',
    categories: [
      {
        id: 'c-env',
        name: 'Academy Environment',
        arName: 'بيئة الأكاديمية',
        weight: 100,
        questions: [
          // Added missing type property
          { id: 'q-guard-1', text: 'Satisfaction with academy facilities', arText: 'الرضا عن مرافق الأكاديمية', weight: 50, type: 'RATING' },
          { id: 'q-guard-2', text: 'Clarity of academy communication', arText: 'وضوح تواصل الأكاديمية', weight: 50, type: 'RATING' }
        ]
      }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin-1',
    name: 'Academy Director',
    email: 'admin@footpulse.app',
    mobile: '+44 7700 900000',
    role: UserRole.ADMIN,
    password: 'password123',
    avatar: 'https://picsum.photos/200/200?random=1',
    // Fix: Added missing isActive property required by User interface
    isActive: true
  },
  {
    id: 'u-trainer-1',
    name: 'Coach Mike Johnson',
    email: 'mike@footpulse.app',
    mobile: '+44 7700 900001',
    role: UserRole.TRAINER,
    password: 'password123',
    avatar: 'https://picsum.photos/200/200?random=2',
    // Fix: Added missing isActive property required by User interface
    isActive: true
  },
  {
    id: 'u-player-1',
    name: 'Leo Messi Jr.',
    email: 'leo@footpulse.app',
    mobile: '+44 7700 900002',
    role: UserRole.PLAYER,
    password: 'password123',
    trainerId: 'u-trainer-1',
    avatar: 'https://picsum.photos/200/200?random=3',
    // Fix: Added missing isActive property required by User interface
    isActive: true
  },
  {
    id: 'u-guardian-1',
    name: 'Messi Senior',
    email: 'senior@footpulse.app',
    mobile: '+44 7700 900003',
    role: UserRole.GUARDIAN,
    password: 'password123',
    playerId: 'u-player-1',
    avatar: 'https://picsum.photos/200/200?random=4',
    // Fix: Added missing isActive property required by User interface
    isActive: true
  }
];
