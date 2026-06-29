import { db } from '../src/database.js';

const SEED_SONGS = [
  // Mehdi Hassan
  {
    youtube_video_id: 'H-xRmg3aCeg',
    title: 'Ranjish Hi Sahi Dil Hi Dukhane Ke Liye Aa',
    singer_name: 'Mehdi Hassan',
    film_name: 'Mohabbat',
    decade: '1970s',
    genre: 'Ghazal',
    thumbnail_url: 'https://img.youtube.com/vi/H-xRmg3aCeg/hqdefault.jpg',
    duration_seconds: 375,
  },
  {
    youtube_video_id: 'yv6Fm60w6vA',
    title: 'Gulon Mein Rang Bhare Baad-e-Naubahar Chale',
    singer_name: 'Mehdi Hassan',
    film_name: 'Farangi',
    decade: '1960s',
    genre: 'Ghazal',
    thumbnail_url: 'https://img.youtube.com/vi/yv6Fm60w6vA/hqdefault.jpg',
    duration_seconds: 400,
  },
  {
    youtube_video_id: 'Z3uO2yU7rC4',
    title: 'Mohabbat Karne Wale Kam Na Honge',
    singer_name: 'Mehdi Hassan',
    film_name: 'Classic Ghazal',
    decade: '1980s',
    genre: 'Ghazal',
    thumbnail_url: 'https://img.youtube.com/vi/Z3uO2yU7rC4/hqdefault.jpg',
    duration_seconds: 390,
  },
  {
    youtube_video_id: '3FvYmJk82d0',
    title: 'Pyar Bhare Do Sharmile Nain',
    singer_name: 'Mehdi Hassan',
    film_name: 'Chahat',
    decade: '1970s',
    genre: 'Film Song',
    thumbnail_url: 'https://img.youtube.com/vi/3FvYmJk82d0/hqdefault.jpg',
    duration_seconds: 290,
  },

  // Noor Jehan
  {
    youtube_video_id: 'E8S6gBfG2Jc',
    title: 'Mujh Se Pehli Si Mohabbat Mere Mehboob Na Maang',
    singer_name: 'Noor Jehan',
    film_name: 'Faiz Poetry',
    decade: '1960s',
    genre: 'Ghazal',
    thumbnail_url: 'https://img.youtube.com/vi/E8S6gBfG2Jc/hqdefault.jpg',
    duration_seconds: 330,
  },
  {
    youtube_video_id: 'NnK9m2tPcr8',
    title: 'Chandni Raatein Pyar Ki Baatein',
    singer_name: 'Noor Jehan',
    film_name: 'Dupatta',
    decade: '1950s',
    genre: 'Film Song',
    thumbnail_url: 'https://img.youtube.com/vi/NnK9m2tPcr8/hqdefault.jpg',
    duration_seconds: 245,
  },
  {
    youtube_video_id: 'uAezbL4r38c',
    title: 'Gaaye Gi Duniya Geet Mere Surile Ang Mein',
    singer_name: 'Noor Jehan',
    film_name: 'Mushaera',
    decade: '1970s',
    genre: 'Film Song',
    thumbnail_url: 'https://img.youtube.com/vi/uAezbL4r38c/hqdefault.jpg',
    duration_seconds: 280,
  },
  {
    youtube_video_id: 'Z-E6t8jWnE0',
    title: 'Awaaz De Kahan Hai',
    singer_name: 'Noor Jehan',
    film_name: 'Anmol Ghadi',
    decade: '1940s',
    genre: 'Film Song',
    thumbnail_url: 'https://img.youtube.com/vi/Z-E6t8jWnE0/hqdefault.jpg',
    duration_seconds: 210,
  },

  // Nusrat Fateh Ali Khan & Qawwali
  {
    youtube_video_id: '4Z8H_h6X_oI',
    title: 'Yeh Jo Halka Halka Suroor Hai',
    singer_name: 'Nusrat Fateh Ali Khan',
    film_name: 'Classic Qawwali',
    decade: '1990s',
    genre: 'Qawwali',
    thumbnail_url: 'https://img.youtube.com/vi/4Z8H_h6X_oI/hqdefault.jpg',
    duration_seconds: 820,
  },
  {
    youtube_video_id: '8_2aI4_hFfA',
    title: 'Tumhe Dillagi Bhool Jani Padegi',
    singer_name: 'Nusrat Fateh Ali Khan',
    film_name: 'Ghazal/Qawwali',
    decade: '1990s',
    genre: 'Qawwali',
    thumbnail_url: 'https://img.youtube.com/vi/8_2aI4_hFfA/hqdefault.jpg',
    duration_seconds: 640,
  },
  {
    youtube_video_id: '1G6_3Uo8X_w',
    title: 'Tajdar-e-Haram O Shenshah-e-Batha',
    singer_name: 'Sabri Brothers',
    film_name: 'Classic Qawwali',
    decade: '1970s',
    genre: 'Qawwali',
    thumbnail_url: 'https://img.youtube.com/vi/1G6_3Uo8X_w/hqdefault.jpg',
    duration_seconds: 960,
  },
  {
    youtube_video_id: 'YvW2Gk9Z_sY',
    title: 'Bhar Do Jholi Meri Ya Muhammad',
    singer_name: 'Sabri Brothers',
    film_name: 'Sufi Qawwali',
    decade: '1970s',
    genre: 'Qawwali',
    thumbnail_url: 'https://img.youtube.com/vi/YvW2Gk9Z_sY/hqdefault.jpg',
    duration_seconds: 880,
  },

  // Iqbal Bano & Ghulam Ali
  {
    youtube_video_id: 'n9r3hW1cR9s',
    title: 'Hum Dekhenge Lazim Hai Ke Hum Bhi Dekhenge',
    singer_name: 'Iqbal Bano',
    film_name: 'Faiz Poetry Live',
    decade: '1980s',
    genre: 'Ghazal',
    thumbnail_url: 'https://img.youtube.com/vi/n9r3hW1cR9s/hqdefault.jpg',
    duration_seconds: 480,
  },
  {
    youtube_video_id: 'vLpxxG98j7A',
    title: 'Chupke Chupke Raat Din Ansoo Bahana Yaad Hai',
    singer_name: 'Ghulam Ali',
    film_name: 'Nikaah',
    decade: '1980s',
    genre: 'Ghazal',
    thumbnail_url: 'https://img.youtube.com/vi/vLpxxG98j7A/hqdefault.jpg',
    duration_seconds: 520,
  },

  // Ahmed Rushdi & Alamgir (Pop & Film Era)
  {
    youtube_video_id: 'n4FwD71L-K0',
    title: 'Ko Ko Korina (First Pop Song)',
    singer_name: 'Ahmed Rushdi',
    film_name: 'Armaan',
    decade: '1960s',
    genre: 'Film Song',
    thumbnail_url: 'https://img.youtube.com/vi/n4FwD71L-K0/hqdefault.jpg',
    duration_seconds: 165,
  },
  {
    youtube_video_id: 'qZ_4c-uS6eA',
    title: 'Albela Rahi Jiye Akela',
    singer_name: 'Alamgir',
    film_name: 'Pop Hits',
    decade: '1970s',
    genre: 'Folk',
    thumbnail_url: 'https://img.youtube.com/vi/qZ_4c-uS6eA/hqdefault.jpg',
    duration_seconds: 220,
  },
  {
    youtube_video_id: 'k5F0_W_w37c',
    title: 'Mera Babu Chhail Chhabila Main To Nachoongi',
    singer_name: 'Runa Laila',
    film_name: 'Babu Hits',
    decade: '1970s',
    genre: 'Film Song',
    thumbnail_url: 'https://img.youtube.com/vi/k5F0_W_w37c/hqdefault.jpg',
    duration_seconds: 215,
  },

  // Nayyara Noor (PTV Nostalgia)
  {
    youtube_video_id: 'yD4_1U9M88I',
    title: 'Ae Jazba-e-Dil Gar Main Chahoon',
    singer_name: 'Nayyara Noor',
    film_name: 'Behzad Lakhnavi Poetry',
    decade: '1970s',
    genre: 'Ghazal',
    thumbnail_url: 'https://img.youtube.com/vi/yD4_1U9M88I/hqdefault.jpg',
    duration_seconds: 280,
  },
  {
    youtube_video_id: 'FfVv3t5xJ-I',
    title: 'Watan Ki Mitti Gawah Rehna',
    singer_name: 'Nayyara Noor',
    film_name: 'National Song',
    decade: '1980s',
    genre: 'Folk',
    thumbnail_url: 'https://img.youtube.com/vi/FfVv3t5xJ-I/hqdefault.jpg',
    duration_seconds: 320,
  }
];

const SEED_COLLECTIONS = [
  {
    id: '8c89b252-8fa3-4318-912f-68f4e64ee810',
    name: "Mehdi Hassan's Greatest Ghazals",
    description: 'Immerse yourself in the soulful rendering of the King of Ghazal, featuring timeless poetry of Faiz, Ghalib, and Faraz.',
    cover_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    is_curated: true,
    songIds: ['H-xRmg3aCeg', 'yv6Fm60w6vA', 'Z3uO2yU7rC4', '3FvYmJk82d0']
  },
  {
    id: 'b1a201c1-4df2-421b-be4c-cd14c356f912',
    name: 'Madam Noor Jehan Film Classics',
    description: 'Timeless cinematic masterpieces sung by Malika-e-Taranum (Queen of Melody) Noor Jehan, spanning five decades of Lollywood.',
    cover_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    is_curated: true,
    songIds: ['E8S6gBfG2Jc', 'NnK9m2tPcr8', 'uAezbL4r38c', 'Z-E6t8jWnE0']
  },
  {
    id: '5d8a9e70-a352-4467-bc18-9b8bfe6cd314',
    name: 'Golden Era Qawwalis',
    description: 'Ecstatic Sufi devotional qawwalis by Nusrat Fateh Ali Khan and the legendary Sabri Brothers.',
    cover_image_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=60',
    is_curated: true,
    songIds: ['4Z8H_h6X_oI', '8_2aI4_hFfA', '1G6_3Uo8X_w', 'YvW2Gk9Z_sY']
  },
  {
    id: '6e74f810-b91c-43f0-8c2f-efab9c6c2105',
    name: 'PTV Nostalgia & Ghazal Classics',
    description: 'Nostalgic tracks from the Golden Era of Pakistan Television (PTV) broadcasts, including Iqbal Bano, Ghulam Ali, and Nayyara Noor.',
    cover_image_url: 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=500&auto=format&fit=crop&q=60',
    is_curated: true,
    songIds: ['n9r3hW1cR9s', 'vLpxxG98j7A', 'yD4_1U9M88I', 'FfVv3t5xJ-I']
  },
  {
    id: 'e2a4cd50-d7a8-42bc-9d22-1d54e6fe8901',
    name: 'Lollywood Golden 60s & 70s',
    description: 'Upbeat and nostalgic cinematic highlights from Ahmed Rushdi, Alamgir, and Runa Laila.',
    cover_image_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&auto=format&fit=crop&q=60',
    is_curated: true,
    songIds: ['n4FwD71L-K0', 'qZ_4c-uS6eA', 'k5F0_W_w37c', 'yv6Fm60w6vA']
  }
];

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // 1. Initialize DB structure
    await db.init();

    // 2. Seed Songs
    console.log('Seeding songs...');
    const savedSongsMap = new Map();
    for (const songData of SEED_SONGS) {
      const savedSong = await db.saveSong(songData);
      savedSongsMap.set(savedSong.youtube_video_id, savedSong);
      console.log(`- Saved song: ${savedSong.title} (${savedSong.singer_name})`);
    }

    // 3. Seed Collections
    console.log('Seeding collections...');
    for (const collData of SEED_COLLECTIONS) {
      const { songIds, ...collectionFields } = collData;
      const savedColl = await db.saveCollection(collectionFields);
      console.log(`- Saved collection: ${savedColl.name}`);

      // Map songs to collection
      let position = 1;
      for (const ytId of songIds) {
        const songRecord = savedSongsMap.get(ytId);
        if (songRecord) {
          await db.saveCollectionSong(savedColl.id, songRecord.id, position);
          position++;
        }
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
