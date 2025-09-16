import axios from 'axios';

// Base URL za FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

// Kreiranje axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor za dodavanje tokena u zahteve
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Tipovi za API response-ove
export interface UserIn {
  username: string;
  email: string;
  password: string;
  title?: string;
  description?: string;
  location?: string;
  skills?: string[];
}

export interface UserDB {
  username: string;
  email: string;
  password: string;
  title?: string;
  description?: string;
  location?: string;
  skills?: string[];
  _id: string;
  role: 'user' | 'admin';
  followers?: string[];
  following?: string[];
}

export interface UserPublic {
 
  username: string;
  email: string;
  title?: string;
  description?: string;
  location?: string;
  skills: string[];
}



export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  title?: string;
  description?: string;
  location?: string;
  skills?: string[];
}

export interface Idea {
  title: string;
  description: string;
  market: string;
  target_audience: string;
  created_at?: string;
}

export interface IdeaDB {

  title: string;
  description: string;
  market: string;
  target_audience: string;
  created_at: string;
  _id: string;
  created_by: string;
  author_username?: string; // novo polje
}

export interface IdeaUpdate {
  title?: string;
  description?: string;
  market?: string;
  target_audience?: string;
  
}

export interface Evaluation {
  idea_id: string;
  user_id: string;
  score?: number;
  comment?: string;
  liked?: boolean;
}

export interface EvaluationDB {
  idea_id: string;
  user_id: string;
  score?: number;
  comment?: string;
  liked: boolean;
  _id: string;
}

// API funkcije
export const authAPI = {
  // Registracija korisnika
  register: async (userData: UserIn) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri registraciji');
    }
  },

  // Login korisnika
  login: async (credentials: { username: string; password: string }) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      formData.append('grant_type', 'password');

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri prijavi');
    }
  },
};



export const usersAPI = {
  // Dobijanje svih korisnika
  getAllUsers: async (): Promise<UserPublic[]> => {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju korisnika');
    }
  },

  // Kreiranje korisnika
  createUser: async (userData: UserIn): Promise<UserDB> => {
    try {
      const response = await api.post('/users/', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri kreiranju korisnika');
    }
  },

  // Dobijanje trenutnog korisnika
  getMe: async (): Promise<UserDB> => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju profila');
    }
  },

  // Dobijanje korisnika po ID-u
  getUser: async (userId: string): Promise<UserDB> => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju korisnika');
    }
  },

  // Ažuriranje korisnika
  updateUser: async (userData: UserUpdate): Promise<UserDB> => {
    try {
      const response = await api.patch('/users/updateMe', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri ažuriranju profila');
    }
  },

  // Brisanje korisnika
  deleteUser: async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri brisanju korisnika');
    }
  },


followUser: async (username: string) => {
  try {
    const response = await api.post(`/users/follow/${encodeURIComponent(username)}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || 'Greška pri praćenju korisnika'
    );
  }
},


unfollowUser: async (username: string) => {
  try {
    const response = await api.post(`/users/unfollow/${encodeURIComponent(username)}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || 'Greška pri otkačivanju korisnika'
    );
  }
},

  // Dobijanje pratilaca
 // Dobijanje pratilaca (followers) po username
getFollowers: async (username: string) => {
  try {
    const response = await api.get(`/users/followers/${encodeURIComponent(username)}`);
    return response.data; // očekujemo listu stringova (usernames)
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || 'Greška pri učitavanju pratilaca'
    );
  }
},

// Dobijanje praćenih korisnika (following) po username
getFollowing: async (username: string) => {
  try {
    const response = await api.get(`/users/following/${encodeURIComponent(username)}`);
    return response.data; // očekujemo listu stringova (usernames)
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || 'Greška pri učitavanju praćenih korisnika'
    );
  }
},


  // Dobijanje informacija o korisniku
  getUserInfo: async (username: string) => {
    try {
      const response = await api.get(`/users/user-info/by-username/${username}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 'Greška pri učitavanju informacija o korisniku'
      );
    }
  },
};

export const ideasAPI = {
  // Dobijanje svih ideja
  getAllIdeas: async (): Promise<IdeaDB[]> => {
    try {
      const response = await api.get('/ideas/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju ideja');
    }
  },

  // Kreiranje ideje
  createIdea: async (ideaData: Idea): Promise<IdeaDB> => {
    try {
      const response = await api.post('/ideas/', ideaData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri kreiranju ideje');
    }
  },

  // Dobijanje ideje po ID-u
  getIdea: async (ideaId: string): Promise<IdeaDB> => {
    try {
      const response = await api.get(`/ideas/${ideaId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju ideje');
    }
  },

  // Ažuriranje ideje
  updateIdea: async (ideaId: string, ideaData: IdeaUpdate): Promise<IdeaDB> => {
    try {
      const response = await api.patch(`/ideas/${ideaId}`, ideaData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri ažuriranju ideje');
    }
  },

  // Brisanje ideje
  deleteIdea: async (ideaId: string) => {
    try {
      await api.delete(`/ideas/${ideaId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri brisanju ideje');
    }
  },

  // Dobijanje ideja korisnika
  getUserIdeas: async (userId: string): Promise<IdeaDB[]> => {
    try {
      const response = await api.get(`/ideas/userideas/${userId}/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju ideja korisnika');
    }
  },

  // Filtriranje ideja
  filterIdeas: async (filters: {
    min_created_at?: string;
    max_created_at?: string;
    min_likes?: number;
    min_score?: number;
    min_followers?: number;
  }) => {
    try {
      const response = await api.get('/ideas/filter-ideje/', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri filtriranju ideja');
    }
  },

  // Dobijanje ideja od popularnih kreatora
  getIdeasByPopularCreators: async () => {
    try {
      const response = await api.get('/users/ideas/by-popular-creators');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju ideja popularnih kreatora');
    }
  },
};

export const evaluationsAPI = {
  // Evaluacija ideje
  evaluateIdea: async (evaluationData: Evaluation): Promise<EvaluationDB> => {
    try {
      const response = await api.post(`/evaluations/`, evaluationData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri evaluaciji ideje');
    }
  },

  // Dobijanje svih evaluacija
  getAllEvaluations: async (): Promise<EvaluationDB[]> => {
    try {
      const response = await api.get('/evaluations/getall/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju evaluacija');
    }
  },

  // Dobijanje svih ocena za ideju
  getIdeaEvaluations: async (ideaId: string) => {
    try {
      const response = await api.get(`/evaluations/vratisveocene/${ideaId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju ocena ideje');
    }
  },

  // Like ideje
  likeIdea: async (userId: string, ideaId: string) => {
    try {
      const response = await api.post('/evaluations/like', null, {
        params: { user_id: userId, idea_id: ideaId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri lajkovanju ideje');
    }
  },

  // Brojanje lajkova
  getLikesCount: async (ideaId: string) => {
    try {
      const response = await api.get(`/evaluations/likes/count/${ideaId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju broja lajkova');
    }
  },

  // Dobijanje korisnika koji su lajkovali
  getLikedUsernames: async (ideaId: string) => {
    try {
      const response = await api.get(`/evaluations/likes/usernames/${ideaId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Greška pri učitavanju korisnika koji su lajkovali');
    }
  },
};

// Utility funkcije za token management
export const tokenUtils = {
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default api;