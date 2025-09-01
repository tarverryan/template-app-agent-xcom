import { PostGenerationResult } from '../../shared/types';
import { logger } from '../../utils/logger';
import { createHash } from 'crypto';

// 32 Topic Categories for Template Bot
export const TEMPLATE_TOPICS = {
  // Battle & Warrior Topics (8)
  battle_wisdom: 'Battle Wisdom',
  war_experience: 'War Experience',
  weapon_knowledge: 'Weapon Knowledge',
  combat_psychology: 'Combat Psychology',
  tactical_thinking: 'Tactical Thinking',
  warrior_code: 'Warrior Code',
  battlefield_leadership: 'Battlefield Leadership',
  survival_in_combat: 'Survival in Combat',

  // Philosophy & Life Lessons (8)
  personal_philosophy: 'Personal Philosophy',
  death_mortality: 'Death & Mortality',
  redemption_change: 'Redemption & Change',
  inner_struggle: 'Inner Struggle',
  wisdom_experience: 'Wisdom from Experience',
  life_advice: 'Life Advice',
  purpose_meaning: 'Purpose & Meaning',
  fate_choice: 'Fate vs Choice',

  // Relationships & Social (6)
  friendship_loyalty: 'Friendship & Loyalty',
  trust_betrayal: 'Trust & Betrayal',
  leadership: 'Leadership',
  family_bonds: 'Family Bonds',
  romance: 'Romance',
  social_dynamics: 'Social Dynamics',

  // Northern Culture & Identity (4)
  northern_values: 'Northern Values',
  cultural_traditions: 'Cultural Traditions',
  regional_pride: 'Regional Pride',
  cultural_differences: 'Cultural Differences',

  // Modern Life & Humor (6)
  modern_life: 'Modern Life Observations',
  technology_change: 'Technology & Change',
  social_media: 'Social Media & Communication',
  work_labor: 'Work & Labor',
  humor_wit: 'Humor & Wit',
  everyday_wisdom: 'Everyday Wisdom'
};

// Topic weights for balanced distribution
export const TOPIC_WEIGHTS = {
  // Heavy rotation (40%)
  battle_wisdom: 0.08,
  personal_philosophy: 0.08,
  friendship_loyalty: 0.08,
  inner_struggle: 0.08,
  modern_life: 0.08,

  // Medium rotation (35%)
  war_experience: 0.07,
  life_advice: 0.07,
  leadership: 0.07,
  northern_values: 0.07,
  humor_wit: 0.07,

  // Light rotation (25%)
  weapon_knowledge: 0.05,
  romance: 0.05,
  technology_change: 0.05,
  cultural_traditions: 0.05,
  everyday_wisdom: 0.05,

  // Very light rotation
  combat_psychology: 0.03,
  tactical_thinking: 0.03,
  warrior_code: 0.03,
  battlefield_leadership: 0.03,
  survival_in_combat: 0.03,
  death_mortality: 0.03,
  redemption_change: 0.03,
  wisdom_experience: 0.03,
  purpose_meaning: 0.03,
  fate_choice: 0.03,
  trust_betrayal: 0.03,
  family_bonds: 0.03,
  social_dynamics: 0.03,
  regional_pride: 0.03,
  cultural_differences: 0.03,
  social_media: 0.03,
  work_labor: 0.03
};

export class TemplatePostGenerator {
  private static readonly MODEL = 'template-bot-local';
  private static readonly COST_PER_POST = 0.001; // Minimal cost for local generation
  private static readonly TOKENS_PER_POST = 50; // Estimated tokens for local generation

  // Generate all posts for a topic
  static generateTopicPosts(topic: string, count: number = 63): PostGenerationResult[] {
    const posts: PostGenerationResult[] = [];
    const topicName = TEMPLATE_TOPICS[topic as keyof typeof TEMPLATE_TOPICS];
    
    if (!topicName) {
      throw new Error(`Unknown topic: ${topic}`);
    }

    logger.info(`Generating ${count} posts for topic: ${topicName}`);

    // Get the topic-specific posts
    const topicPosts = this.getTopicPosts(topic);
    
    // Generate variations
    for (let i = 0; i < count; i++) {
      const post = this.generateVariation(topicPosts, i);
      posts.push({
        content: post,
        category: topic,
        tokens_used: this.TOKENS_PER_POST,
        cost: this.COST_PER_POST,
        model: this.MODEL
      });
    }

    return posts;
  }

  // Generate all 2,016 posts
  static generateAllPosts(): PostGenerationResult[] {
    const allPosts: PostGenerationResult[] = [];
    const topics = Object.keys(TEMPLATE_TOPICS);
    
    logger.info(`Generating all posts for ${topics.length} topics`);

    for (const topic of topics) {
      const topicPosts = this.generateTopicPosts(topic, 63);
      allPosts.push(...topicPosts);
    }

    logger.info(`Generated ${allPosts.length} total posts`);
    return allPosts;
  }

  // Generate additional unique posts (for expanding the database)
  static generateAdditionalPosts(count: number = 400): PostGenerationResult[] {
    const allPosts: PostGenerationResult[] = [];
    const topics = Object.keys(TEMPLATE_TOPICS);
    const postsPerTopic = Math.ceil(count / topics.length);
    
    logger.info(`Generating ${count} additional posts across ${topics.length} topics (${postsPerTopic} per topic)`);

    for (const topic of topics) {
      const topicPosts = this.generateAdditionalTopicPosts(topic, postsPerTopic);
      allPosts.push(...topicPosts);
    }

    // Trim to exact count if needed
    const finalPosts = allPosts.slice(0, count);
    logger.info(`Generated ${finalPosts.length} additional unique posts`);
    return finalPosts;
  }

  // Generate additional posts for a topic using expanded templates
  static generateAdditionalTopicPosts(topic: string, count: number = 13): PostGenerationResult[] {
    const posts: PostGenerationResult[] = [];
    const topicName = TEMPLATE_TOPICS[topic as keyof typeof TEMPLATE_TOPICS];
    
    if (!topicName) {
      throw new Error(`Unknown topic: ${topic}`);
    }

    logger.info(`Generating ${count} additional posts for topic: ${topicName}`);

    // Get the expanded topic-specific posts
    const topicPosts = this.getExpandedTopicPosts(topic);
    
    // Generate variations
    for (let i = 0; i < count; i++) {
      const post = this.generateVariation(topicPosts, i + 1000); // Use different seed
      posts.push({
        content: post,
        category: topic,
        tokens_used: this.TOKENS_PER_POST,
        cost: this.COST_PER_POST,
        model: this.MODEL
      });
    }

    return posts;
  }

  // Get expanded base posts for a specific topic (for additional content)
  private static getExpandedTopicPosts(topic: string): string[] {
    const expandedTopicPosts: { [key: string]: string[] } = {
      battle_wisdom: [
        "The best weapon is the one you know how to use. The worst is the one you think makes you look dangerous.",
        "In battle, the first rule is stay alive. Everything else comes after.",
        "A man who fights for nothing dies for nothing. Choose your battles wisely.",
        "The strongest warrior isn't the one who never falls. It's the one who keeps getting up.",
        "Fear keeps you alive. Panic gets you killed. Learn the difference.",
        "Sometimes the best strategy is to let your enemy think he's winning. Then show him he's not.",
        "Honor isn't about how you fight. It's about why you fight.",
        "A leader who won't fight beside his men doesn't deserve to lead them.",
        "Stay alive first. Win second. Everything else comes after.",
        "The best defense is knowing when to attack.",
        // Additional unique templates
        "A warrior's greatest weapon is his mind. His second greatest is his sword.",
        "The battlefield doesn't care about your reasons. It only cares about your results.",
        "Every scar tells a story. Every story teaches a lesson.",
        "The best fighters are the ones who know when not to fight.",
        "Courage without wisdom is just stupidity with a sword.",
        "The deadliest enemy is the one you underestimate.",
        "A true warrior fights for what he believes, not what he's told to believe.",
        "The best strategy is the one that keeps your men alive.",
        "War is not about glory. It's about survival.",
        "The strongest weapon is the one your enemy never sees coming."
      ],
      war_experience: [
        "War isn't glorious. It's just men killing each other for reasons they've forgotten.",
        "In war, you learn that courage and stupidity look the same from a distance.",
        "The best warriors aren't the bravest. They're the ones who know when to run.",
        "War changes men. Some for better, most for worse.",
        "The dead don't care about your reasons. They just want you to remember them.",
        "Every battle teaches you something. If you're lucky, you live long enough to learn it.",
        "War is like a fire. It consumes everything, including the men who start it.",
        "The price of war is paid in blood, not gold.",
        "In war, there are no winners. Only survivors.",
        "War makes monsters of us all. The question is whether we can become men again.",
        // Additional unique templates
        "The first casualty of war is always the truth.",
        "War doesn't determine who's right. Only who's left.",
        "Every war ends, but the scars never heal.",
        "The best soldiers are the ones who hate war the most.",
        "War is the failure of diplomacy and the triumph of stupidity.",
        "In war, the only certainty is uncertainty.",
        "The deadliest weapon in war is time.",
        "War teaches you that peace is precious.",
        "Every war is fought by young men who don't understand why.",
        "The cost of war is always higher than anyone expects."
      ],
      weapon_knowledge: [
        "A sword is only as good as the hand that holds it. And the hand is only as good as the mind that guides it.",
        "The best weapon is the one you can use without thinking.",
        "Every weapon has its purpose. Every purpose has its weapon.",
        "A blade is just metal until you give it meaning.",
        "The deadliest weapon is the one your enemy doesn't see coming.",
        "Respect your weapon. It might be the only thing that keeps you alive.",
        "A weapon is only as dangerous as the man wielding it.",
        "The best fighters know their weapons like they know their own hands.",
        "Every weapon tells a story. Make sure yours is worth telling.",
        "A weapon is a tool. Use it wisely.",
        // Additional unique templates
        "The most dangerous weapon is the one you don't know how to use.",
        "A weapon without purpose is just expensive decoration.",
        "The best weapon is the one that fits your hand perfectly.",
        "Every weapon has a weakness. Find it before your enemy does.",
        "A weapon is only as sharp as the mind behind it.",
        "The deadliest weapon is the one your enemy underestimates.",
        "A weapon without skill is just a heavy stick.",
        "The best weapon is the one you can rely on when everything else fails.",
        "Every weapon has a history. Make sure yours is honorable.",
        "A weapon is a responsibility, not a privilege."
      ],
      personal_philosophy: [
        "You have to be realistic about these things.",
        "A man's got to know his limitations.",
        "The world is what it is. You can either accept it or fight it.",
        "Sometimes the hardest thing is doing nothing.",
        "You can't change the past, but you can learn from it.",
        "The truth is rarely pure and never simple.",
        "A man's worth is measured by his actions, not his words.",
        "The only thing worse than being wrong is being wrong and not knowing it.",
        "Life is what happens while you're making other plans.",
        "The best revenge is living well.",
        // Additional unique templates
        "Sometimes the wisest thing to do is nothing at all.",
        "A man who doesn't know himself is lost before he starts.",
        "The truth hurts, but lies kill.",
        "You can't fix everything, but you can try to fix what matters.",
        "The hardest lesson is learning when to let go.",
        "A man's character is revealed in his darkest moments.",
        "The only certainty in life is uncertainty.",
        "You can't control everything, but you can control how you react.",
        "The best teacher is experience, but the tuition is high.",
        "Sometimes the bravest thing is admitting you're wrong."
      ],
      life_advice: [
        "Don't make promises you can't keep.",
        "Trust your gut, but verify with your head.",
        "The best time to plant a tree was twenty years ago. The second best time is now.",
        "You can't please everyone, so don't try.",
        "Actions speak louder than words, but words can still hurt.",
        "The only way to do great work is to love what you do.",
        "Life is too short to hold grudges.",
        "The best investment you can make is in yourself.",
        "You miss 100% of the shots you don't take.",
        "The early bird gets the worm, but the second mouse gets the cheese.",
        // Additional unique templates
        "Sometimes the best advice is to keep your mouth shut.",
        "You can't change people, but you can change how you deal with them.",
        "The hardest thing to learn is when to stop learning.",
        "Life is not fair, but that doesn't mean you shouldn't try to be.",
        "The best revenge is success.",
        "You can't control the wind, but you can adjust your sails.",
        "The only person you can truly rely on is yourself.",
        "Life is what you make of it, but sometimes it makes you.",
        "The best time to start is now, but the best time to finish is when it's done.",
        "You can't have everything, but you can have what matters."
      ],
      modern_life: [
        "The world changes faster than we do.",
        "Sometimes the old ways are the best ways.",
        "Progress isn't always improvement.",
        "The more things change, the more they stay the same.",
        "Technology is a tool, not a master.",
        "The past has lessons, the future has possibilities.",
        "Change is inevitable, but not always welcome.",
        "The simple life isn't always simple.",
        "Modern problems require modern solutions.",
        "The good old days weren't always good.",
        // Additional unique templates
        "Sometimes the best technology is no technology.",
        "The faster we move, the more we miss.",
        "Progress for progress's sake is pointless.",
        "The old ways worked for a reason.",
        "Change is good, but not all change is good.",
        "The more connected we are, the more alone we feel.",
        "Simplicity is the ultimate sophistication.",
        "The past teaches, the present tests, the future rewards.",
        "Modern life is complex, but wisdom is simple.",
        "The best things in life aren't things."
      ],
      humor_wit: [
        "Life is too short to be serious all the time.",
        "A good laugh is worth a thousand words.",
        "Humor is the best medicine, but timing is everything.",
        "The best jokes are the ones that make you think.",
        "Laughter is contagious, but so is misery.",
        "A witty remark can disarm an enemy faster than a sword.",
        "Humor is the weapon of the wise.",
        "The best comedians are the ones who've suffered.",
        "A joke at the right time can save a life.",
        "Laughter is the sound of the soul healing.",
        // Additional unique templates
        "Sometimes the best response is a well-timed joke.",
        "Humor is the armor of the intelligent.",
        "The best jokes have a grain of truth.",
        "Laughter is the universal language.",
        "A good sense of humor is a sign of intelligence.",
        "The best comedians are philosophers in disguise.",
        "Humor can make the unbearable bearable.",
        "The best jokes are the ones that hurt a little.",
        "Laughter is the best revenge.",
        "A witty man is never truly alone."
      ],
      friendship_loyalty: [
        "A true friend is one who walks in when the rest of the world walks out.",
        "Loyalty is earned, not given.",
        "Friendship is the only cement that will ever hold the world together.",
        "A friend is someone who knows all about you and still likes you.",
        "Loyalty is the foundation of all relationships.",
        "True friendship is rare and precious.",
        "A loyal friend is worth more than gold.",
        "Friendship is born at that moment when one person says to another.",
        "Loyalty means nothing unless it has at its heart the absolute principle of self-sacrifice.",
        "A friend is one who overlooks your broken fence and admires the flowers in your garden.",
        // Additional unique templates
        "True friends are the family you choose.",
        "Loyalty is tested in times of trouble.",
        "A friend who deserts you in time of need is no friend at all.",
        "Friendship is the only relationship that survives death.",
        "Loyalty is the highest form of love.",
        "A true friend never asks for anything in return.",
        "Friendship is the greatest gift life can give.",
        "Loyalty is the foundation of honor.",
        "A friend is someone who makes you laugh when you don't even want to smile.",
        "True friendship is built on trust and respect."
      ]
    };

    return expandedTopicPosts[topic] || this.getTopicPosts(topic);
  }

  // Get base posts for a specific topic
  private static getTopicPosts(topic: string): string[] {
    const topicPosts: { [key: string]: string[] } = {
      battle_wisdom: [
        "The best weapon is the one you know how to use. The worst is the one you think makes you look dangerous.",
        "In battle, the first rule is stay alive. Everything else comes after.",
        "A man who fights for nothing dies for nothing. Choose your battles wisely.",
        "The strongest warrior isn't the one who never falls. It's the one who keeps getting up.",
        "Fear keeps you alive. Panic gets you killed. Learn the difference.",
        "Sometimes the best strategy is to let your enemy think he's winning. Then show him he's not.",
        "Honor isn't about how you fight. It's about why you fight.",
        "A leader who won't fight beside his men doesn't deserve to lead them.",
        "Stay alive first. Win second. Everything else comes after.",
        "The best defense is knowing when to attack."
      ],
      war_experience: [
        "War isn't glorious. It's just men killing each other for reasons they've forgotten.",
        "In war, you learn that courage and stupidity look the same from a distance.",
        "The best warriors aren't the bravest. They're the ones who know when to run.",
        "War changes men. Some for better, most for worse.",
        "The dead don't care about your reasons. They just want you to remember them.",
        "Every battle teaches you something. If you're lucky, you live long enough to learn it.",
        "War is like a fire. It consumes everything, including the men who start it.",
        "The price of war is paid in blood, not gold.",
        "In war, there are no winners. Only survivors.",
        "War makes monsters of us all. The question is whether we can become men again."
      ],
      weapon_knowledge: [
        "A sword is only as good as the hand that holds it. And the hand is only as good as the mind that guides it.",
        "The best weapon is the one you can use without thinking.",
        "Every weapon has its purpose. Every purpose has its weapon.",
        "A blade is just metal until you give it meaning.",
        "The deadliest weapon is the one your enemy doesn't see coming.",
        "Respect your weapon. It might be the only thing that keeps you alive.",
        "A weapon is only as dangerous as the man wielding it.",
        "The best fighters know their weapons like they know their own hands.",
        "Every weapon tells a story. Make sure yours is worth telling.",
        "A weapon is a tool. Use it wisely."
      ],
      combat_psychology: [
        "Fear keeps you alive. Panic gets you killed. Learn the difference.",
        "The mind is the first weapon. The body is just the tool.",
        "In battle, your thoughts can kill you faster than any blade.",
        "Confidence wins fights. Arrogance loses them.",
        "The best warriors control their fear, not eliminate it.",
        "Your enemy's mind is as important as his sword.",
        "Combat is as much psychology as it is skill.",
        "The strongest weapon is a clear mind.",
        "Fear is your friend. Terror is your enemy.",
        "In battle, the mind must be as sharp as the blade."
      ],
      tactical_thinking: [
        "Sometimes the best strategy is to let your enemy think he's winning. Then show him he's not.",
        "The best tactician is the one who adapts to the battlefield, not the one who tries to change it.",
        "Every battle is different. Every enemy is different. Adapt or die.",
        "The best plan is the one that survives contact with the enemy.",
        "Tactics win battles. Strategy wins wars.",
        "Know your enemy. Know yourself. Know the ground.",
        "The best move is sometimes no move at all.",
        "Patience is a weapon. Use it wisely.",
        "The battlefield is a teacher. Learn from it.",
        "Sometimes retreat is the best advance."
      ],
      warrior_code: [
        "Honor isn't about how you fight. It's about why you fight.",
        "A warrior's word is his bond. Break it and you break yourself.",
        "The code isn't about rules. It's about who you are.",
        "Honor is what you do when no one is watching.",
        "A true warrior fights for others, not for glory.",
        "The code is simple: do what's right, not what's easy.",
        "Honor is the only thing that survives death.",
        "A warrior without honor is just a killer.",
        "The code isn't written in books. It's written in blood.",
        "Honor is the difference between a warrior and a murderer."
      ],
      battlefield_leadership: [
        "A leader who won't fight beside his men doesn't deserve to lead them.",
        "Leadership isn't about giving orders. It's about setting an example.",
        "The best leaders lead from the front, not from behind walls.",
        "A true leader shares the danger with his men.",
        "Leadership is earned in battle, not given in peace.",
        "The best commanders know their men's names.",
        "A leader's courage inspires his men's courage.",
        "Leadership is about responsibility, not privilege.",
        "The best leaders are servants to their men.",
        "A leader who asks his men to do what he won't do is no leader at all."
      ],
      survival_in_combat: [
        "Stay alive first. Win second. Everything else comes after.",
        "Survival isn't about being the strongest. It's about being the last one standing.",
        "The first rule of staying alive: never trust a man who smiles too much.",
        "In the wild, you learn that everything wants to kill you. Men are no different.",
        "Survival is a skill. Like any skill, it can be learned.",
        "The best survivors are the ones who know when to run.",
        "Survival isn't about winning. It's about not losing.",
        "The deadliest enemy is the one you don't see coming.",
        "Survival is about adaptation, not strength.",
        "The best survivors are the ones who think ahead."
      ],
      personal_philosophy: [
        "Life is short and brutal. Best to spend it with people worth dying for.",
        "Maybe the point isn't to find meaning in life, but to give meaning to the life you have.",
        "We make our choices, then our choices make us.",
        "The past is written. The future is a blank page. The present is where you write your story.",
        "Life is like a battle. You don't get to choose when it starts, but you can choose how you fight.",
        "The meaning of life is to give life meaning.",
        "Every man has his own path. Some are longer than others.",
        "Life is what happens while you're making other plans.",
        "The best life is the one you choose to live.",
        "Life is a journey, not a destination."
      ],
      death_mortality: [
        "Death comes for us all. The question is whether you face it or run.",
        "The dead don't care about your reasons. They just want you to remember them.",
        "Death is the great equalizer. It doesn't care about your wealth or status.",
        "Every man dies. Not every man truly lives.",
        "Death is just another enemy. Face it with courage.",
        "The fear of death is worse than death itself.",
        "Death is the price we pay for life.",
        "The dead are at peace. It's the living who suffer.",
        "Death is not the end. It's just the beginning of something else.",
        "Face death with dignity, and you'll live with honor."
      ],
      redemption_change: [
        "Maybe a man can change. I'm trying, but the past doesn't let go easily.",
        "Redemption isn't about forgetting what you've done. It's about doing better.",
        "The Bloody-Nine can't be killed, but maybe he can be tamed. I hope so.",
        "Change is hard. But it's harder to live with who you used to be.",
        "Every man deserves a chance to be better than he was.",
        "Redemption is a journey, not a destination.",
        "The past is a prison. The future is freedom. Choose wisely.",
        "You can't change what you've done, but you can change what you do.",
        "Redemption is earned, not given.",
        "The hardest battle is the one against yourself."
      ],
      inner_struggle: [
        "The Bloody-Nine is always there, waiting. I try to keep him chained.",
        "Sometimes I wonder if the man or the monster is the real me.",
        "The battle within is harder than any battle without.",
        "Every man has his demons. The question is whether you let them control you.",
        "The strongest enemy is the one inside your head.",
        "Inner peace is harder to find than outer peace.",
        "The mind is a battlefield. Choose your side wisely.",
        "Your greatest enemy is yourself.",
        "The struggle within defines the man without.",
        "Inner strength is the hardest strength to build."
      ],
      wisdom_experience: [
        "You learn more from one defeat than from a hundred victories.",
        "Experience is the best teacher. Unfortunately, it's also the most expensive.",
        "Wisdom comes from making mistakes. Intelligence comes from learning from them.",
        "The older you get, the more you realize how little you know.",
        "Experience is what you get when you don't get what you want.",
        "Wisdom is knowing what to do. Experience is knowing how to do it.",
        "The best lessons are the ones that hurt the most.",
        "Experience is the price of wisdom.",
        "You can't buy experience. You have to earn it.",
        "Wisdom is the reward for surviving your mistakes."
      ],
      life_advice: [
        "Don't waste time on people who wouldn't waste time on you. Life's too short for that.",
        "The best time to fix a problem is before it becomes a problem. The second best time is now.",
        "Life is too short to hold grudges. But it's also too short to forget lessons.",
        "Choose your battles wisely. Not every fight is worth fighting.",
        "The best investment you can make is in yourself.",
        "Life is what happens while you're making other plans.",
        "The only person you can change is yourself.",
        "Life is a series of choices. Make good ones.",
        "The best life is the one you choose to live.",
        "Life is too short to be anything but happy."
      ],
      purpose_meaning: [
        "Maybe the point isn't to find meaning in life, but to give meaning to the life you have.",
        "Purpose is what you make of it. Meaning is what you give to it.",
        "The meaning of life is to give life meaning.",
        "Find your purpose, and you'll find your peace.",
        "Purpose is the compass that guides your life.",
        "The best purpose is the one that serves others.",
        "Meaning comes from what you do, not what you have.",
        "Purpose is the fuel that drives your soul.",
        "The meaning of life is to live a meaningful life.",
        "Find your purpose, and you'll find your power."
      ],
      fate_choice: [
        "We make our choices, then our choices make us.",
        "Fate is what happens to you. Choice is what you do about it.",
        "You can't control what happens to you, but you can control how you respond.",
        "Destiny is not written in stone. It's written in choices.",
        "The future is not set. It's created by the choices you make today.",
        "Fate is the hand you're dealt. Choice is how you play it.",
        "You are the author of your own story. Write it well.",
        "Choice is the greatest power you have. Use it wisely.",
        "The past is fate. The future is choice.",
        "Your choices define your destiny."
      ],
      friendship_loyalty: [
        "A friend who stands with you in battle is worth more than gold.",
        "Loyalty is the only thing that matters when everything else is blood and steel.",
        "I've killed many men, but I'd die for my friends. That's the difference.",
        "A true friend is the one who stays when everyone else leaves.",
        "Loyalty is not given. It's earned.",
        "Friendship is the only wealth that matters.",
        "A friend in need is a friend indeed. A friend in battle is a friend forever.",
        "Loyalty is the foundation of any relationship worth having.",
        "True friends are hard to find and harder to lose.",
        "Friendship is the only thing that survives death."
      ],
      trust_betrayal: [
        "Trust is hard to earn and easy to lose. I've learned that the hard way.",
        "Betrayal cuts deeper than any blade.",
        "Trust is the foundation of everything worth having.",
        "Once trust is broken, it's harder to repair than to replace.",
        "Trust is earned in drops and lost in buckets.",
        "The worst wounds are the ones you can't see.",
        "Trust is a gift. Don't waste it on those who don't deserve it.",
        "Betrayal is the price of trust.",
        "Trust is the currency of relationships.",
        "The hardest thing to trust is your own judgment."
      ],
      leadership: [
        "A true leader doesn't need to tell you he's in charge. You just know.",
        "Leadership isn't about power. It's about responsibility.",
        "The best leaders lead by example, not by command.",
        "A leader's job is to serve his people, not to rule them.",
        "Leadership is earned, not given.",
        "The best leaders are the ones who make others better.",
        "Leadership is about vision, not position.",
        "A true leader takes responsibility for his team's failures.",
        "Leadership is not about being in charge. It's about taking care of those in your charge.",
        "The best leaders are the ones who don't need to be leaders."
      ],
      family_bonds: [
        "Blood doesn't make family. Loyalty does.",
        "Family is not about blood. It's about who's there when you need them.",
        "The strongest bonds are the ones forged in adversity.",
        "Family is the foundation of everything worth having.",
        "Blood is thicker than water, but loyalty is thicker than blood.",
        "Family is not about who you're related to. It's about who you'd die for.",
        "The best family is the one you choose.",
        "Family is the only thing that matters in the end.",
        "Blood makes you related. Loyalty makes you family.",
        "Family is the anchor that keeps you grounded."
      ],
      romance: [
        "Love is like war. Easy to start, hard to finish, and you never know how it'll end.",
        "The heart wants what it wants. The head knows what it needs.",
        "Love is the only thing stronger than fear.",
        "The best love is the kind that makes you better.",
        "Love is not about finding the perfect person. It's about finding the person who makes you perfect.",
        "The heart has reasons that reason doesn't understand.",
        "Love is the greatest adventure of all.",
        "The best love stories are the ones that last.",
        "Love is not about possession. It's about partnership.",
        "The heart knows what the mind cannot understand."
      ],
      social_dynamics: [
        "Men are like wolves. They follow the strongest, but they respect the wisest.",
        "Society is just a pack with rules.",
        "People are predictable. Groups are not.",
        "The strongest survive, but the wisest thrive.",
        "Social order is just violence by another name.",
        "People follow leaders, not ideas.",
        "The best leaders understand human nature.",
        "Society is built on trust and destroyed by betrayal.",
        "People are more alike than they are different.",
        "The strongest bonds are forged in adversity."
      ],
      northern_values: [
        "In the North, we say a man's worth is measured by his enemies. I've been worth a lot.",
        "The North doesn't care about your dreams. It only cares if you can survive.",
        "Northern hospitality means sharing your fire, your food, and your blade.",
        "The cold teaches you what you can survive. The North doesn't forgive weakness.",
        "In the North, we value strength, honor, and loyalty above all else.",
        "The North is harsh, but it's honest.",
        "Northern wisdom is hard-won and well-earned.",
        "The North doesn't care about your past. It only cares about your present.",
        "In the North, we say what we mean and mean what we say.",
        "The North is not for the weak of heart or weak of will."
      ],
      cultural_traditions: [
        "Northern hospitality means sharing your fire, your food, and your blade.",
        "Traditions are the foundation of culture. Respect them.",
        "Every culture has its wisdom. Learn from all of them.",
        "Traditions are not rules. They're guidelines for living.",
        "The best traditions are the ones that bring people together.",
        "Culture is what you make of it.",
        "Traditions are the stories we tell ourselves about who we are.",
        "The strongest cultures are the ones that adapt.",
        "Traditions are the bridge between past and present.",
        "Culture is the soul of a people."
      ],
      regional_pride: [
        "The North doesn't care about your dreams. It only cares if you can survive.",
        "Regional pride is about knowing where you come from.",
        "Every region has its strengths. Every region has its weaknesses.",
        "Pride in your home is pride in yourself.",
        "The best regions are the ones that welcome strangers.",
        "Regional pride is not about being better than others. It's about being the best version of yourself.",
        "Home is where your heart is. Pride is where your soul is.",
        "The strongest regions are the ones that work together.",
        "Regional pride is about identity, not superiority.",
        "The best regions are the ones that remember their roots."
      ],
      cultural_differences: [
        "Southerners talk about honor. Northerners live it.",
        "Cultural differences are what make the world interesting.",
        "Every culture has its own wisdom. Learn from all of them.",
        "Differences are not divisions. They're opportunities to learn.",
        "The best cultures are the ones that respect others.",
        "Cultural differences are the spice of life.",
        "Every culture has something to teach us.",
        "Differences are what make us unique. Similarities are what make us human.",
        "The strongest cultures are the ones that adapt and grow.",
        "Cultural differences are bridges, not walls."
      ],
      modern_life: [
        "People today worry about things that wouldn't last five minutes in the North. Perspective changes everything.",
        "Modern life is complicated, but people are still the same.",
        "Technology changes, but human nature doesn't.",
        "The more things change, the more they stay the same.",
        "Modern life is fast, but wisdom is slow.",
        "People today have more comforts but less contentment.",
        "The modern world is complex, but the human heart is simple.",
        "Technology makes life easier, but it doesn't make it better.",
        "Modern life is about convenience, but life is about meaning.",
        "The more connected we are, the more alone we feel."
      ],
      technology_change: [
        "They say the world is getting smaller. Feels like it's getting more complicated.",
        "Technology changes how we live, but not why we live.",
        "The more things change, the more they stay the same.",
        "Technology is a tool, not a solution.",
        "The best technology is the kind that serves people, not the other way around.",
        "Technology makes life easier, but it doesn't make it simpler.",
        "The more advanced we get, the more we need the basics.",
        "Technology is progress, but wisdom is timeless.",
        "The best technology is the kind that brings people together.",
        "Technology changes the world, but people change themselves."
      ],
      social_media: [
        "In my day, if you wanted to insult someone, you had to do it to their face. Now they hide behind screens.",
        "Social media is like a mirror. It shows you what you want to see.",
        "The more connected we are, the more disconnected we become.",
        "Social media is a tool. Use it wisely.",
        "The best communication is still face to face.",
        "Social media makes it easy to talk, but hard to listen.",
        "The more followers you have, the fewer friends you need.",
        "Social media is about connection, but real connection is about presence.",
        "The best social media is the kind that brings people together.",
        "Social media is a window to the world, but it's not the world."
      ],
      work_labor: [
        "A man should take pride in his work, whatever it is. Even if it's killing people.",
        "Work is not about what you do. It's about who you become.",
        "The best work is the kind that serves others.",
        "Work is a reflection of your character.",
        "The hardest work is the work you do on yourself.",
        "Work is not about money. It's about meaning.",
        "The best workers are the ones who care about their work.",
        "Work is a teacher. Learn from it.",
        "The most important work is the work you do for others.",
        "Work is not about success. It's about significance."
      ],
      humor_wit: [
        "They say you can't teach an old dog new tricks. But you can teach an old warrior new ways to kill. That counts, right?",
        "Life is too short to be serious all the time. Even warriors need to laugh.",
        "The best humor is the kind that makes you think.",
        "Laughter is the best medicine. Unless you're bleeding. Then it's bandages.",
        "The best jokes are the ones that are true.",
        "Humor is the weapon of the wise.",
        "The best humor is the kind that brings people together.",
        "Laughter is the sound of the soul healing.",
        "The best jokes are the ones that make you think.",
        "Humor is the light in the darkness."
      ],
      everyday_wisdom: [
        "The best time to fix a problem is before it becomes a problem. The second best time is now.",
        "Common sense is not so common.",
        "The best advice is the kind you can actually use.",
        "Wisdom is knowing what to do. Common sense is doing it.",
        "The best solutions are often the simplest ones.",
        "Everyday wisdom is the wisdom that gets you through the day.",
        "The best advice is the kind that works.",
        "Common sense is the foundation of wisdom.",
        "The best solutions are the ones that work.",
        "Everyday wisdom is the wisdom of experience."
      ]
    };

    return topicPosts[topic] || [];
  }

  // Generate a variation of a base post
  private static generateVariation(basePosts: string[], index: number): string {
    if (basePosts.length === 0) {
      return "You have to be realistic about these things.";
    }

    // Use the base post as a template and create variations
    const basePost = basePosts[index % basePosts.length] || "You have to be realistic about these things.";
    
    // Create variations by slightly modifying the base post
    const variations = this.createVariations(basePost);
    const variationIndex = Math.floor(index / basePosts.length);
    
    const result = variations[variationIndex % variations.length] || basePost;
    
    // Remove quotes from the final result to ensure clean output
    return result.replace(/^"|"$/g, '');
  }

  // Create variations of a base post
  private static createVariations(basePost: string): string[] {
    const variations: string[] = [basePost];
    
    // Add some variations based on the base post
    if (basePost.includes("war")) {
      variations.push(
        "War changes everything. Including the men who fight it.",
        "War is the great teacher. Unfortunately, the lessons are expensive.",
        "In war, you learn what you're really made of."
      );
    }
    
    if (basePost.includes("battle")) {
      variations.push(
        "Battle reveals the truth about men.",
        "In battle, there are no secrets.",
        "Battle is the ultimate test of character."
      );
    }
    
    if (basePost.includes("friend")) {
      variations.push(
        "True friends are rare. Treasure them.",
        "Friendship is the only wealth that matters.",
        "A friend in need is a friend indeed."
      );
    }
    
    if (basePost.includes("life")) {
      variations.push(
        "Life is what you make of it.",
        "Life teaches hard lessons. Learn them well.",
        "Life is too short to waste on foolishness."
      );
    }
    
    if (basePost.includes("North")) {
      variations.push(
        "The North teaches hard lessons.",
        "Northern wisdom is earned, not given.",
        "The North doesn't forgive weakness."
      );
    }
    
    if (basePost.includes("Bloody-Nine")) {
      variations.push(
        "The Bloody-Nine is always there, waiting.",
        "Sometimes the monster is stronger than the man.",
        "The Bloody-Nine doesn't ask permission."
      );
    }

    // Ensure all variations are under 280 characters and remove any quotes
    return variations
      .filter(post => post.length <= 280)
      .map(post => post.replace(/^"|"$/g, ''));
  }

  // Generate content hash for uniqueness checking
  static generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  // Get random topic based on weights
  static getRandomTopic(): string {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [topic, weight] of Object.entries(TOPIC_WEIGHTS)) {
      cumulative += weight;
      if (random <= cumulative) {
        return topic;
      }
    }
    
    const topicKeys = Object.keys(TEMPLATE_TOPICS);
    return topicKeys.length > 0 ? topicKeys[0] || 'battle_wisdom' : 'battle_wisdom'; // fallback
  }
}
