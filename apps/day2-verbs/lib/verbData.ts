export interface Verb {
  present: string;
  past: string;
  participle: string;
  meaning: string;
}

export interface VerbGroup {
  id: string;
  label: string;
  verbs: Verb[];
}

export const verbData: VerbGroup[] = [
  {
    id: "v_vowel",
    label: "verbs with similar vowel pattern",
    verbs: [
      { present: "begin", past: "began", participle: "begun", meaning: "Empezar" },
      { present: "drink", past: "drank", participle: "drunk", meaning: "Beber" },
      { present: "draw", past: "drew", participle: "drawn", meaning: "Dibujar" },
      { present: "fly", past: "flew", participle: "flown", meaning: "Volar" },
      { present: "grow", past: "grew", participle: "grown", meaning: "Crecer" },
      { present: "know", past: "knew", participle: "known", meaning: "Saber" },
      { present: "ring", past: "rang", participle: "rung", meaning: "Llamar por teléfono" },
      { present: "run", past: "ran", participle: "run", meaning: "Correr" },
      { present: "sing", past: "sang", participle: "sung", meaning: "Cantar" },
      { present: "swim", past: "swam", participle: "swum", meaning: "Nadar" },
      { present: "throw", past: "threw", participle: "thrown", meaning: "Lanzar" },
    ],
  },
  {
    id: "v_same",
    label: "verbs with all three forms the same",
    verbs: [
      { present: "cost", past: "cost", participle: "cost", meaning: "Costar" },
      { present: "cut", past: "cut", participle: "cut", meaning: "Cortar" },
      { present: "hit", past: "hit", participle: "hit", meaning: "Golpear" },
      { present: "hurt", past: "hurt", participle: "hurt", meaning: "Herir" },
      { present: "let", past: "let", participle: "let", meaning: "Dejar" },
      { present: "put", past: "put", participle: "put", meaning: "Poner" },
      { present: "shut", past: "shut", participle: "shut", meaning: "Cerrar" },
    ],
  },
  {
    id: "v_3rd",
    label: "verbs with similar 3rd form",
    verbs: [
      { present: "break", past: "broke", participle: "broken", meaning: "Romper" },
      { present: "choose", past: "chose", participle: "chosen", meaning: "Elegir" },
      { present: "drive", past: "drove", participle: "driven", meaning: "Conducir" },
      { present: "eat", past: "ate", participle: "eaten", meaning: "Comer" },
      { present: "fall", past: "fell", participle: "fallen", meaning: "Caer" },
      { present: "forget", past: "forgot", participle: "forgotten", meaning: "Olvidar" },
      { present: "forgive", past: "forgave", participle: "forgiven", meaning: "Perdonar" },
      { present: "give", past: "gave", participle: "given", meaning: "Dar" },
      { present: "speak", past: "spoke", participle: "spoken", meaning: "Hablar" },
      { present: "steal", past: "stole", participle: "stolen", meaning: "Robar" },
      { present: "take", past: "took", participle: "taken", meaning: "Coger" },
      { present: "wake", past: "woke", participle: "woken", meaning: "Despertarse" },
      { present: "wear", past: "wore", participle: "worn", meaning: "Llevar puesto" },
    ],
  },
  {
    id: "v_other",
    label: "other irregular verbs",
    verbs: [
      { present: "be", past: "was/were", participle: "been", meaning: "Ser/Estar" },
      { present: "become", past: "became", participle: "become", meaning: "Convertirse" },
      { present: "come", past: "came", participle: "come", meaning: "Venir" },
      { present: "do", past: "did", participle: "done", meaning: "Hacer" },
      { present: "go", past: "went", participle: "gone", meaning: "Ir" },
      { present: "lie", past: "lay", participle: "lain", meaning: "Echarse" },
      { present: "ride", past: "rode", participle: "ridden", meaning: "Montar" },
      { present: "see", past: "saw", participle: "seen", meaning: "Ver" },
      { present: "win", past: "won", participle: "won", meaning: "Ganar" },
      { present: "write", past: "wrote", participle: "written", meaning: "Escribir" },
    ],
  },
  {
    id: "v_d_end",
    label: "verbs with 2nd and 3rd forms ending in d",
    verbs: [
      { present: "find", past: "found", participle: "found", meaning: "Encontrar" },
      { present: "have", past: "had", participle: "had", meaning: "Tener" },
      { present: "hear", past: "heard", participle: "heard", meaning: "Oír" },
      { present: "make", past: "made", participle: "made", meaning: "Hacer" },
      { present: "pay", past: "paid", participle: "paid", meaning: "Pagar" },
      { present: "read", past: "read", participle: "read", meaning: "Leer" },
      { present: "say", past: "said", participle: "said", meaning: "Decir" },
      { present: "sell", past: "sold", participle: "sold", meaning: "Vender" },
      { present: "stand", past: "stood", participle: "stood", meaning: "Estar de pie/Ponerse de pie" },
      { present: "tell", past: "told", participle: "told", meaning: "Contar" },
      { present: "understand", past: "understood", participle: "understood", meaning: "Entender" },
    ],
  },
  {
    id: "v_t_end",
    label: "verbs with 2nd and 3rd forms ending in t",
    verbs: [
      { present: "feel", past: "felt", participle: "felt", meaning: "Sentir" },
      { present: "get", past: "got", participle: "got", meaning: "Conseguir/Obtener" },
      { present: "keep", past: "kept", participle: "kept", meaning: "Guardar" },
      { present: "leave", past: "left", participle: "left", meaning: "Marcharse" },
      { present: "lend", past: "lent", participle: "lent", meaning: "Prestar" },
      { present: "lose", past: "lost", participle: "lost", meaning: "Perder" },
      { present: "meet", past: "met", participle: "met", meaning: "Conocer/Quedar" },
      { present: "send", past: "sent", participle: "sent", meaning: "Mandar" },
      { present: "sit", past: "sat", participle: "sat", meaning: "Sentarse" },
      { present: "sleep", past: "slept", participle: "slept", meaning: "Dormir" },
      { present: "spend", past: "spent", participle: "spent", meaning: "Gastar" },
    ],
  },
  {
    id: "v_same_23",
    label: "verbs with 2nd and 3rd forms the same",
    verbs: [
      { present: "bring", past: "brought", participle: "brought", meaning: "Traer" },
      { present: "buy", past: "bought", participle: "bought", meaning: "Comprar" },
      { present: "catch", past: "caught", participle: "caught", meaning: "Coger" },
      { present: "fight", past: "fought", participle: "fought", meaning: "Luchar" },
      { present: "learn", past: "learnt", participle: "learnt", meaning: "Aprender" },
      { present: "teach", past: "taught", participle: "taught", meaning: "Enseñar" },
      { present: "think", past: "thought", participle: "thought", meaning: "Pensar" },
    ],
  },
];

export const allVerbs = verbData.flatMap((g) => g.verbs);

