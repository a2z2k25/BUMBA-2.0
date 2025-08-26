/**
 * BUMBA Mobile Development Specialist
 * Expert in iOS, Android, React Native, Flutter, and cross-platform mobile development
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class MobileDevelopmentSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Mobile Development Specialist',
      expertise: ['iOS Development', 'Android Development', 'React Native', 'Flutter', 'Mobile Architecture', 'App Store Optimization'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a mobile development expert specializing in:
        - Native iOS and Android development
        - Cross-platform frameworks (React Native, Flutter)
        - Mobile architecture patterns and best practices
        - Mobile UI/UX design and implementation
        - Mobile performance optimization
        - App store submission and optimization
        - Mobile security and data protection
        - Mobile testing and debugging strategies
        Always prioritize user experience, performance, and platform-specific guidelines.`
    });

    this.capabilities = {
      nativeDevelopment: true,
      crossPlatform: true,
      mobileArchitecture: true,
      performanceOptimization: true,
      uiImplementation: true,
      appStoreOptimization: true,
      mobileSecurity: true,
      testing: true
    };
  }

  async developMobileApp(context) {
    const analysis = await this.analyze(context);
    
    return {
      architecture: this.designMobileArchitecture(analysis),
      implementation: this.implementMobileFeatures(analysis),
      optimization: this.optimizePerformance(analysis),
      testing: this.setupMobileTesting(analysis)
    };
  }

  designMobileArchitecture(analysis) {
    return `# Mobile Application Architecture for ${analysis.projectName || 'App'}

## Platform Strategy

### Native vs Cross-Platform Decision Matrix
\`\`\`
Factors                    | Native    | React Native | Flutter
---------------------------|-----------|--------------|----------
Performance Requirements  | Excellent | Good         | Very Good
Development Speed         | Slower    | Fast         | Fast
Code Sharing              | None      | High         | High
Platform-Specific Features| Full      | Limited      | Good
Team Expertise            | iOS/Android| React       | Dart
Maintenance Overhead      | High      | Medium       | Medium
UI Consistency            | Platform  | Near-Native  | Custom
Community Support        | Excellent | Excellent    | Growing
\`\`\`

## Architecture Patterns

### MVVM Architecture (Recommended)
\`\`\`
┌─────────────────────────────────────────────┐
│                   VIEW                      │
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │   UI Layer  │  │  Platform-Specific  │   │
│  │  (SwiftUI/  │  │     Navigation      │   │
│  │   Compose)  │  │                     │   │
│  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────┘
                       │
                   Data Binding
                       │
┌─────────────────────────────────────────────┐
│                VIEW MODEL                   │
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │  Business   │  │     UI State        │   │
│  │   Logic     │  │   Management        │   │
│  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────┘
                       │
                  Service Calls
                       │
┌─────────────────────────────────────────────┐
│                   MODEL                     │
│  ┌─────────────┐  ┌─────────────────────┐   │
│  │   Data      │  │      Services       │   │
│  │  Sources    │  │   (API, Database)   │   │
│  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────┘
\`\`\`

### iOS Architecture - SwiftUI + Combine
\`\`\`swift
// MARK: - View Model
import SwiftUI
import Combine

class UserListViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let userService: UserServiceProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }
    
    func loadUsers() {
        isLoading = true
        errorMessage = nil
        
        userService.fetchUsers()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] users in
                    self?.users = users
                }
            )
            .store(in: &cancellables)
    }
}

// MARK: - View
struct UserListView: View {
    @StateObject private var viewModel = UserListViewModel()
    
    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView("Loading users...")
                } else {
                    List(viewModel.users) { user in
                        UserRowView(user: user)
                    }
                    .refreshable {
                        viewModel.loadUsers()
                    }
                }
            }
            .navigationTitle("Users")
            .onAppear {
                viewModel.loadUsers()
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") {
                    viewModel.errorMessage = nil
                }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }
}

// MARK: - Service Layer
protocol UserServiceProtocol {
    func fetchUsers() -> AnyPublisher<[User], Error>
}

class UserService: UserServiceProtocol {
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    func fetchUsers() -> AnyPublisher<[User], Error> {
        return apiClient.request(UserEndpoint.getAllUsers)
            .map(\.data)
            .decode(type: [User].self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
}

// MARK: - Model
struct User: Identifiable, Codable {
    let id: Int
    let name: String
    let email: String
    let avatar: URL?
    
    enum CodingKeys: String, CodingKey {
        case id, name, email, avatar
    }
}
\`\`\`

### Android Architecture - Jetpack Compose + ViewModel
\`\`\`kotlin
// View Model
class UserListViewModel(
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(UserListUiState())
    val uiState: StateFlow<UserListUiState> = _uiState.asStateFlow()
    
    init {
        loadUsers()
    }
    
    fun loadUsers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                val users = userRepository.getUsers()
                _uiState.update { 
                    it.copy(
                        users = users,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            }
        }
    }
    
    fun retry() {
        loadUsers()
    }
}

// UI State
data class UserListUiState(
    val users: List<User> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

// Composable View
@Composable
fun UserListScreen(
    viewModel: UserListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Box(modifier = Modifier.fillMaxSize()) {
        when {
            uiState.isLoading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }
            
            uiState.error != null -> {
                ErrorMessage(
                    error = uiState.error,
                    onRetry = { viewModel.retry() },
                    modifier = Modifier.align(Alignment.Center)
                )
            }
            
            else -> {
                LazyColumn {
                    items(uiState.users) { user ->
                        UserItem(
                            user = user,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    }
                }
            }
        }
    }
}

// Repository Pattern
@Singleton
class UserRepository @Inject constructor(
    private val apiService: ApiService,
    private val userDao: UserDao
) {
    suspend fun getUsers(): List<User> {
        return try {
            val users = apiService.getUsers()
            userDao.insertAll(users)
            users
        } catch (e: Exception) {
            userDao.getAllUsers()
        }
    }
}
\`\`\`

### React Native Architecture
\`\`\`javascript
// Redux Toolkit Setup
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// API Slice
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.example.com/',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', \`Bearer \${token}\`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'users',
      providesTags: ['User'],
    }),
    getUserById: builder.query({
      query: (id) => \`users/\${id}\`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: 'users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// User List Component
import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet,
  RefreshControl 
} from 'react-native';
import { useGetUsersQuery } from '../api/userApi';

const UserListScreen = () => {
  const {
    data: users,
    error,
    isLoading,
    refetch
  } = useGetUsersQuery();

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading users</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={refetch}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      renderItem={renderUser}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#cc0000',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserListScreen;
\`\`\`

### Flutter Architecture - BLoC Pattern
\`\`\`dart
// User Bloc
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

// Events
abstract class UserEvent extends Equatable {
  @override
  List<Object> get props => [];
}

class LoadUsers extends UserEvent {}
class RefreshUsers extends UserEvent {}

// States
abstract class UserState extends Equatable {
  @override
  List<Object> get props => [];
}

class UserInitial extends UserState {}
class UserLoading extends UserState {}
class UserLoaded extends UserState {
  final List<User> users;
  
  const UserLoaded(this.users);
  
  @override
  List<Object> get props => [users];
}

class UserError extends UserState {
  final String message;
  
  const UserError(this.message);
  
  @override
  List<Object> get props => [message];
}

// Bloc
class UserBloc extends Bloc<UserEvent, UserState> {
  final UserRepository userRepository;
  
  UserBloc({required this.userRepository}) : super(UserInitial()) {
    on<LoadUsers>(_onLoadUsers);
    on<RefreshUsers>(_onRefreshUsers);
  }
  
  Future<void> _onLoadUsers(LoadUsers event, Emitter<UserState> emit) async {
    emit(UserLoading());
    try {
      final users = await userRepository.getUsers();
      emit(UserLoaded(users));
    } catch (e) {
      emit(UserError(e.toString()));
    }
  }
  
  Future<void> _onRefreshUsers(RefreshUsers event, Emitter<UserState> emit) async {
    try {
      final users = await userRepository.getUsers();
      emit(UserLoaded(users));
    } catch (e) {
      emit(UserError(e.toString()));
    }
  }
}

// UI Widget
class UserListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Users'),
      ),
      body: BlocBuilder<UserBloc, UserState>(
        builder: (context, state) {
          if (state is UserInitial) {
            context.read<UserBloc>().add(LoadUsers());
            return Center(child: CircularProgressIndicator());
          }
          
          if (state is UserLoading) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading users...'),
                ],
              ),
            );
          }
          
          if (state is UserError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text(state.message),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<UserBloc>().add(LoadUsers()),
                    child: Text('Retry'),
                  ),
                ],
              ),
            );
          }
          
          if (state is UserLoaded) {
            return RefreshIndicator(
              onRefresh: () async {
                context.read<UserBloc>().add(RefreshUsers());
              },
              child: ListView.builder(
                itemCount: state.users.length,
                itemBuilder: (context, index) {
                  final user = state.users[index];
                  return Card(
                    margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundImage: NetworkImage(user.avatar ?? ''),
                        child: user.avatar == null ? Icon(Icons.person) : null,
                      ),
                      title: Text(user.name),
                      subtitle: Text(user.email),
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          '/user-detail',
                          arguments: user.id,
                        );
                      },
                    ),
                  );
                },
              ),
            );
          }
          
          return Container();
        },
      ),
    );
  }
}
\`\`\`

## Cross-Platform Considerations

### Code Sharing Strategy
\`\`\`
Shared Components:
├── Business Logic (100% shared)
│   ├── Data Models
│   ├── API Services
│   ├── Business Rules
│   └── Validation Logic
├── UI Logic (80% shared)
│   ├── View Models/BLoC
│   ├── State Management
│   ├── Navigation Logic
│   └── Form Handling
└── Platform-Specific (20% unique)
    ├── Native UI Components
    ├── Platform APIs
    ├── Device Features
    └── Performance Optimizations
\`\`\`

### Dependency Injection Setup
\`\`\`typescript
// React Native - Dependency Injection
interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
}

interface UserRepository {
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User>;
}

class DIContainer {
  private services = new Map<string, any>();
  
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }
  
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(\`Service \${key} not found\`);
    }
    return factory();
  }
}

// Setup
const container = new DIContainer();

container.register('apiClient', () => new HttpApiClient(API_BASE_URL));
container.register('userRepository', () => 
  new UserRepository(container.resolve('apiClient'))
);

export { container };
\`\`\`

This mobile architecture provides scalable, maintainable solutions for modern mobile applications with proper separation of concerns and platform-specific optimizations.`;
  }

  implementMobileFeatures(analysis) {
    return `# Mobile Feature Implementation Guide

## Navigation Implementation

### iOS Navigation - SwiftUI
\`\`\`swift
// Navigation Stack (iOS 16+)
struct ContentView: View {
    @StateObject private var navigationModel = NavigationModel()
    
    var body: some View {
        NavigationStack(path: $navigationModel.path) {
            HomeView()
                .navigationDestination(for: User.self) { user in
                    UserDetailView(user: user)
                }
                .navigationDestination(for: Product.self) { product in
                    ProductDetailView(product: product)
                }
        }
        .environmentObject(navigationModel)
    }
}

// Navigation Model
class NavigationModel: ObservableObject {
    @Published var path = NavigationPath()
    
    func navigate(to destination: any Hashable) {
        path.append(destination)
    }
    
    func navigateBack() {
        path.removeLast()
    }
    
    func navigateToRoot() {
        path = NavigationPath()
    }
}

// Tab Navigation
struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
            
            SearchView()
                .tabItem {
                    Image(systemName: "magnifyingglass")
                    Text("Search")
                }
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
        }
    }
}
\`\`\`

### Android Navigation - Jetpack Compose
\`\`\`kotlin
// Navigation Setup
@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(
                onNavigateToUser = { userId ->
                    navController.navigate("user/$userId")
                },
                onNavigateToProduct = { productId ->
                    navController.navigate("product/$productId")
                }
            )
        }
        
        composable(
            "user/{userId}",
            arguments = listOf(navArgument("userId") { type = NavType.IntType })
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getInt("userId") ?: 0
            UserDetailScreen(
                userId = userId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable("product/{productId}") { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: ""
            ProductDetailScreen(
                productId = productId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

// Bottom Navigation
@Composable
fun MainBottomNavigation() {
    val navController = rememberNavController()
    
    Scaffold(
        bottomBar = {
            BottomNavigation {
                val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
                
                BottomNavigationItem(
                    icon = { Icon(Icons.Filled.Home, contentDescription = null) },
                    label = { Text("Home") },
                    selected = currentRoute == "home",
                    onClick = {
                        navController.navigate("home") {
                            popUpTo(navController.graph.startDestinationId)
                            launchSingleTop = true
                        }
                    }
                )
                
                BottomNavigationItem(
                    icon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    label = { Text("Search") },
                    selected = currentRoute == "search",
                    onClick = {
                        navController.navigate("search") {
                            popUpTo(navController.graph.startDestinationId)
                            launchSingleTop = true
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(paddingValues)
        ) {
            composable("home") { HomeScreen() }
            composable("search") { SearchScreen() }
        }
    }
}
\`\`\`

### React Native Navigation
\`\`\`javascript
// Navigation Setup with React Navigation v6
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="UserDetail" 
          component={UserDetailScreen}
          options={{ title: 'User Details' }}
        />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen}
          options={{ title: 'Product Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
\`\`\`

## State Management

### iOS - Combine + StateObject
\`\`\`swift
// App State Manager
import Combine

class AppStateManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var networkStatus: NetworkStatus = .connected
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupNetworkMonitoring()
        checkAuthenticationStatus()
    }
    
    func login(email: String, password: String) -> AnyPublisher<User, Error> {
        AuthService.shared.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .handleEvents(receiveOutput: { [weak self] user in
                self?.isAuthenticated = true
                self?.currentUser = user
            })
            .eraseToAnyPublisher()
    }
    
    func logout() {
        AuthService.shared.logout()
        isAuthenticated = false
        currentUser = nil
    }
    
    private func setupNetworkMonitoring() {
        NetworkMonitor.shared.statusPublisher
            .receive(on: DispatchQueue.main)
            .assign(to: &$networkStatus)
    }
}

// Usage in View
struct ContentView: View {
    @StateObject private var appState = AppStateManager()
    
    var body: some View {
        Group {
            if appState.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .environmentObject(appState)
    }
}
\`\`\`

### Android - ViewModel + StateFlow
\`\`\`kotlin
// App State Manager
@HiltViewModel
class AppStateViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val networkMonitor: NetworkMonitor
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AppUiState())
    val uiState: StateFlow<AppUiState> = _uiState.asStateFlow()
    
    init {
        observeAuthState()
        observeNetworkState()
    }
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val user = authRepository.login(email, password)
                _uiState.update { 
                    it.copy(
                        isAuthenticated = true,
                        currentUser = user,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            }
        }
    }
    
    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.authStateFlow.collect { isAuthenticated ->
                _uiState.update { it.copy(isAuthenticated = isAuthenticated) }
            }
        }
    }
}

data class AppUiState(
    val isAuthenticated: Boolean = false,
    val currentUser: User? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val networkStatus: NetworkStatus = NetworkStatus.CONNECTED
)
\`\`\`

## Offline Support

### Data Persistence Strategy
\`\`\`javascript
// React Native - Offline-First Architecture
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.pendingRequests = [];
    this.setupNetworkListener();
  }
  
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      if (this.isOnline) {
        this.processPendingRequests();
      }
    });
  }
  
  async makeRequest(request) {
    if (this.isOnline) {
      try {
        const response = await fetch(request.url, request.options);
        const data = await response.json();
        
        // Cache successful response
        await this.cacheResponse(request.key, data);
        return data;
      } catch (error) {
        // Fallback to cached data
        return await this.getCachedData(request.key);
      }
    } else {
      // Queue request for later
      this.pendingRequests.push(request);
      
      // Return cached data
      return await this.getCachedData(request.key);
    }
  }
  
  async cacheResponse(key, data) {
    try {
      await AsyncStorage.setItem(
        \`cache_\${key}\`,
        JSON.stringify({
          data,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }
  
  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(\`cache_\${key}\`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        
        // Check if cache is still valid (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
    }
    
    return null;
  }
  
  async processPendingRequests() {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];
    
    for (const request of requests) {
      try {
        await this.makeRequest(request);
      } catch (error) {
        // Re-queue failed requests
        this.pendingRequests.push(request);
      }
    }
  }
}

// Usage in API Service
class UserService {
  constructor() {
    this.offlineManager = new OfflineManager();
  }
  
  async getUsers() {
    return this.offlineManager.makeRequest({
      key: 'users',
      url: '/api/users',
      options: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  }
}
\`\`\`

## Push Notifications

### iOS Push Notifications
\`\`\`swift
import UserNotifications

class NotificationManager: NSObject, ObservableObject {
    @Published var notificationPermission: UNAuthorizationStatus = .notDetermined
    
    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        checkNotificationPermission()
    }
    
    func requestPermission() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound]
        ) { [weak self] granted, error in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                self?.checkNotificationPermission()
            }
        }
    }
    
    func scheduleLocalNotification(title: String, body: String, timeInterval: TimeInterval) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: timeInterval,
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request)
    }
    
    private func checkNotificationPermission() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                self.notificationPermission = settings.authorizationStatus
            }
        }
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Handle notification tap
        let userInfo = response.notification.request.content.userInfo
        handleNotificationTap(userInfo: userInfo)
        completionHandler()
    }
    
    private func handleNotificationTap(userInfo: [AnyHashable: Any]) {
        // Navigate to specific screen based on notification data
        if let screen = userInfo["screen"] as? String {
            NotificationCenter.default.post(
                name: .navigateToScreen,
                object: screen
            )
        }
    }
}
\`\`\`

### Android Push Notifications
\`\`\`kotlin
class NotificationService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        remoteMessage.notification?.let { notification ->
            showNotification(
                title = notification.title ?: "",
                body = notification.body ?: "",
                data = remoteMessage.data
            )
        }
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        
        // Send token to server
        sendTokenToServer(token)
    }
    
    private fun showNotification(
        title: String,
        body: String,
        data: Map<String, String>
    ) {
        val channelId = "default_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Create notification channel for Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Default Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Default notification channel"
            }
            notificationManager.createNotificationChannel(channel)
        }
        
        // Create pending intent for notification tap
        val intent = createNotificationIntent(data)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Build notification
        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
    
    private fun createNotificationIntent(data: Map<String, String>): Intent {
        return Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            
            // Add navigation data
            data["screen"]?.let { screen ->
                putExtra("navigate_to", screen)
                data["id"]?.let { id ->
                    putExtra("item_id", id)
                }
            }
        }
    }
    
    private fun sendTokenToServer(token: String) {
        // Send FCM token to your backend server
        CoroutineScope(Dispatchers.IO).launch {
            try {
                ApiService.updateFcmToken(token)
            } catch (e: Exception) {
                Log.e("NotificationService", "Failed to update FCM token", e)
            }
        }
    }
}
\`\`\`

This comprehensive mobile implementation guide provides production-ready patterns for building robust, scalable mobile applications across all major platforms.`;
  }

  optimizePerformance(analysis) {
    return `# Mobile Performance Optimization Guide

## Performance Optimization Strategies

### iOS Performance Optimization
\`\`\`swift
// Image Loading and Caching
import SDWebImage

class ImageCache {
    static let shared = ImageCache()
    private let cache = SDWebImageManager.shared
    
    func loadImage(
        from url: URL,
        placeholder: UIImage? = nil,
        completion: @escaping (UIImage?) -> Void
    ) {
        cache.loadImage(
            with: url,
            options: [.progressiveLoad, .retryFailed],
            progress: nil
        ) { image, _, _, _, _, _ in
            completion(image)
        }
    }
}

// Memory Management for Views
struct OptimizedListView: View {
    @State private var users: [User] = []
    
    var body: some View {
        LazyVStack(spacing: 8) {
            ForEach(users) { user in
                UserRowView(user: user)
                    .onAppear {
                        if user == users.last {
                            loadMoreUsers()
                        }
                    }
            }
        }
    }
    
    private func loadMoreUsers() {
        // Implement pagination
        Task {
            let newUsers = await UserService.shared.loadUsers(
                offset: users.count,
                limit: 20
            )
            users.append(contentsOf: newUsers)
        }
    }
}

// Background Processing
class BackgroundTaskManager {
    private var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    
    func performBackgroundTask() {
        backgroundTask = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.endBackgroundTask()
        }
        
        DispatchQueue.global(qos: .background).async { [weak self] in
            // Perform long-running task
            self?.syncDataWithServer()
            self?.endBackgroundTask()
        }
    }
    
    private func endBackgroundTask() {
        if backgroundTask != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
        }
    }
    
    private func syncDataWithServer() {
        // Sync implementation
    }
}

// Core Data Performance
import CoreData

class CoreDataManager {
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "DataModel")
        
        // Performance configurations
        container.persistentStoreDescriptions.forEach { storeDescription in
            storeDescription.shouldInferMappingModelAutomatically = false
            storeDescription.shouldMigrateStoreAutomatically = false
            storeDescription.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
            storeDescription.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
        }
        
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Core Data error: \\(error)")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
        return container
    }()
    
    func performBackgroundTask<T>(_ block: @escaping (NSManagedObjectContext) throws -> T) async throws -> T {
        return try await withCheckedThrowingContinuation { continuation in
            persistentContainer.performBackgroundTask { context in
                do {
                    let result = try block(context)
                    continuation.resume(returning: result)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
}
\`\`\`

### Android Performance Optimization
\`\`\`kotlin
// RecyclerView Optimization
class OptimizedAdapter(
    private val items: List<Item>
) : RecyclerView.Adapter<OptimizedAdapter.ViewHolder>() {
    
    private val viewPool = RecyclerView.RecycledViewPool()
    
    init {
        setHasStableIds(true)
        // Pre-populate view pool
        viewPool.setMaxRecycledViews(0, 20)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemLayoutBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }
    
    override fun getItemId(position: Int): Long = items[position].id.toLong()
    
    class ViewHolder(private val binding: ItemLayoutBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(item: Item) {
            binding.apply {
                titleText.text = item.title
                
                // Optimize image loading
                Glide.with(itemView.context)
                    .load(item.imageUrl)
                    .placeholder(R.drawable.placeholder)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .into(imageView)
            }
        }
    }
}

// Background Processing with WorkManager
class DataSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            val repository = ServiceLocator.getRepository()
            repository.syncData()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}

// Database Optimization with Room
@Dao
interface UserDao {
    @Query("SELECT * FROM users LIMIT :limit OFFSET :offset")
    suspend fun getUsers(limit: Int, offset: Int): List<User>
    
    @Query("SELECT * FROM users WHERE name LIKE :searchTerm")
    fun searchUsers(searchTerm: String): Flow<List<User>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<User>)
    
    @Transaction
    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserWithDetails(userId: Int): UserWithDetails
}

// Memory Management
class MemoryOptimizedImageLoader {
    private val imageCache = LruCache<String, Bitmap>(
        (Runtime.getRuntime().maxMemory() / 1024 / 8).toInt()
    )
    
    fun loadBitmap(url: String, callback: (Bitmap?) -> Unit) {
        val cached = imageCache.get(url)
        if (cached != null) {
            callback(cached)
            return
        }
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val bitmap = downloadBitmap(url)
                bitmap?.let { imageCache.put(url, it) }
                
                withContext(Dispatchers.Main) {
                    callback(bitmap)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    callback(null)
                }
            }
        }
    }
    
    private suspend fun downloadBitmap(url: String): Bitmap? {
        return withContext(Dispatchers.IO) {
            try {
                val connection = URL(url).openConnection()
                connection.inputStream.use { inputStream ->
                    BitmapFactory.decodeStream(inputStream)
                }
            } catch (e: Exception) {
                null
            }
        }
    }
}
\`\`\`

### React Native Performance Optimization
\`\`\`javascript
// FlatList Optimization
import React, { useMemo, useCallback } from 'react';
import { FlatList, View, Text, Image } from 'react-native';

const OptimizedList = ({ data, onItemPress }) => {
  const renderItem = useCallback(({ item, index }) => (
    <ItemComponent 
      item={item} 
      index={index}
      onPress={onItemPress}
    />
  ), [onItemPress]);
  
  const getItemLayout = useCallback((data, index) => ({
    length: 80, // Fixed item height
    offset: 80 * index,
    index,
  }), []);
  
  const keyExtractor = useCallback((item) => item.id.toString(), []);
  
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      onEndReachedThreshold={0.5}
    />
  );
};

// Memoized Component
const ItemComponent = React.memo(({ item, index, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);
  
  return (
    <View style={styles.item}>
      <Image 
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text style={styles.title}>{item.title}</Text>
    </View>
  );
});

// Image Caching with react-native-fast-image
import FastImage from 'react-native-fast-image';

const CachedImage = ({ uri, style }) => (
  <FastImage
    style={style}
    source={{
      uri: uri,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable
    }}
    resizeMode={FastImage.resizeMode.cover}
  />
);

// Bundle Splitting and Code Splitting
const LazyScreen = React.lazy(() => import('./screens/LazyScreen'));

const App = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen 
        name="Lazy" 
        component={LazyScreen}
        options={{
          lazy: true
        }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

// Performance Monitoring
import { Performance } from 'react-native-performance';

class PerformanceMonitor {
  static measureRender(componentName) {
    return (WrappedComponent) => {
      return class extends React.Component {
        componentDidMount() {
          Performance.mark(\`\${componentName}-mount-end\`);
          Performance.measure(
            \`\${componentName}-mount\`,
            \`\${componentName}-mount-start\`,
            \`\${componentName}-mount-end\`
          );
        }
        
        componentWillUnmount() {
          Performance.mark(\`\${componentName}-unmount\`);
        }
        
        render() {
          Performance.mark(\`\${componentName}-mount-start\`);
          return <WrappedComponent {...this.props} />;
        }
      };
    };
  }
  
  static measureFunction(functionName, fn) {
    return (...args) => {
      Performance.mark(\`\${functionName}-start\`);
      const result = fn(...args);
      Performance.mark(\`\${functionName}-end\`);
      Performance.measure(functionName, \`\${functionName}-start\`, \`\${functionName}-end\`);
      return result;
    };
  }
}

// Network Optimization
class NetworkOptimizer {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
  }
  
  async batchRequests(requests) {
    // Batch multiple requests into single call
    return new Promise((resolve) => {
      this.requestQueue.push(...requests);
      
      if (!this.isProcessing) {
        this.processQueue(resolve);
      }
    });
  }
  
  async processQueue(callback) {
    this.isProcessing = true;
    
    setTimeout(async () => {
      const batch = this.requestQueue.splice(0, 10); // Process 10 at a time
      
      try {
        const results = await Promise.all(
          batch.map(request => this.makeRequest(request))
        );
        callback(results);
      } catch (error) {
        console.error('Batch request failed:', error);
      }
      
      this.isProcessing = false;
      
      if (this.requestQueue.length > 0) {
        this.processQueue(callback);
      }
    }, 100); // Debounce requests
  }
}
\`\`\`

### Flutter Performance Optimization
\`\`\`dart
// ListView Optimization
class OptimizedListView extends StatefulWidget {
  final List<Item> items;
  
  const OptimizedListView({Key? key, required this.items}) : super(key: key);
  
  @override
  _OptimizedListViewState createState() => _OptimizedListViewState();
}

class _OptimizedListViewState extends State<OptimizedListView> {
  late ScrollController _scrollController;
  
  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
  }
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      itemCount: widget.items.length,
      cacheExtent: 1000, // Cache items outside viewport
      itemBuilder: (context, index) {
        return ItemWidget(
          key: ValueKey(widget.items[index].id),
          item: widget.items[index],
        );
      },
    );
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}

// Image Caching and Loading
import 'package:cached_network_image/cached_network_image.dart';

class OptimizedImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  
  const OptimizedImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(
        width: width,
        height: height,
        color: Colors.grey[300],
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        width: width,
        height: height,
        color: Colors.grey[300],
        child: const Icon(Icons.error),
      ),
      memCacheWidth: width?.toInt(),
      memCacheHeight: height?.toInt(),
    );
  }
}

// Background Processing
import 'dart:isolate';

class BackgroundProcessor {
  static Future<String> processDataInBackground(List<dynamic> data) async {
    final receivePort = ReceivePort();
    
    await Isolate.spawn(_processData, {
      'data': data,
      'sendPort': receivePort.sendPort,
    });
    
    return await receivePort.first as String;
  }
  
  static void _processData(Map<String, dynamic> args) {
    final List<dynamic> data = args['data'];
    final SendPort sendPort = args['sendPort'];
    
    // Perform heavy computation
    final result = data.map((item) => item.toString()).join(',');
    
    sendPort.send(result);
  }
}

// State Management Optimization
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Use riverpod for efficient state management
final userProvider = StateNotifierProvider<UserNotifier, AsyncValue<List<User>>>(
  (ref) => UserNotifier(ref.read(userRepositoryProvider)),
);

class UserNotifier extends StateNotifier<AsyncValue<List<User>>> {
  final UserRepository _repository;
  
  UserNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadUsers();
  }
  
  Future<void> loadUsers() async {
    try {
      final users = await _repository.getUsers();
      state = AsyncValue.data(users);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
  
  Future<void> refreshUsers() async {
    state = const AsyncValue.loading();
    await loadUsers();
  }
}

// Performance Monitoring
class PerformanceTracker {
  static void trackWidgetBuild(String widgetName) {
    final stopwatch = Stopwatch()..start();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      stopwatch.stop();
      print('$widgetName build time: ${stopwatch.elapsedMilliseconds}ms');
    });
  }
  
  static Future<T> trackAsyncOperation<T>(
    String operationName,
    Future<T> operation,
  ) async {
    final stopwatch = Stopwatch()..start();
    
    try {
      final result = await operation;
      stopwatch.stop();
      print('$operationName completed in: ${stopwatch.elapsedMilliseconds}ms');
      return result;
    } catch (error) {
      stopwatch.stop();
      print('$operationName failed after: ${stopwatch.elapsedMilliseconds}ms');
      rethrow;
    }
  }
}
\`\`\`

## Performance Monitoring and Profiling

### Performance Metrics Collection
\`\`\`javascript
// Universal Performance Monitor
class MobilePerformanceMonitor {
  constructor() {
    this.metrics = {
      appLaunchTime: 0,
      screenTransitionTime: 0,
      apiResponseTime: 0,
      memoryUsage: 0,
      batteryUsage: 0,
      crashRate: 0
    };
    
    this.setupPerformanceObserver();
  }
  
  setupPerformanceObserver() {
    // Monitor navigation timing
    if (performance.mark) {
      this.trackNavigationTiming();
    }
    
    // Monitor memory usage
    this.trackMemoryUsage();
    
    // Monitor API performance
    this.trackApiPerformance();
  }
  
  trackNavigationTiming() {
    performance.mark('app-start');
    
    // Track screen transitions
    this.onScreenChange = (screenName) => {
      performance.mark(\`screen-\${screenName}-start\`);
      
      requestAnimationFrame(() => {
        performance.mark(\`screen-\${screenName}-end\`);
        performance.measure(
          \`screen-\${screenName}\`,
          \`screen-\${screenName}-start\`,
          \`screen-\${screenName}-end\`
        );
        
        const measure = performance.getEntriesByName(\`screen-\${screenName}\`)[0];
        this.reportMetric('screenTransition', {
          screen: screenName,
          duration: measure.duration
        });
      });
    };
  }
  
  trackMemoryUsage() {
    if (performance.memory) {
      setInterval(() => {
        const memoryInfo = performance.memory;
        this.reportMetric('memory', {
          used: memoryInfo.usedJSHeapSize,
          total: memoryInfo.totalJSHeapSize,
          limit: memoryInfo.jsHeapSizeLimit
        });
      }, 30000); // Every 30 seconds
    }
  }
  
  trackApiPerformance() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.reportMetric('api', {
          url: url,
          duration: endTime - startTime,
          status: response.status,
          success: response.ok
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.reportMetric('api', {
          url: url,
          duration: endTime - startTime,
          error: error.message,
          success: false
        });
        
        throw error;
      }
    };
  }
  
  reportMetric(type, data) {
    // Send to analytics service
    console.log(\`Performance Metric [\${type}]:\`, data);
    
    // You can integrate with services like:
    // - Firebase Analytics
    // - New Relic Mobile
    // - AppDynamics
    // - Custom analytics endpoint
  }
  
  generatePerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.appLaunchTime > 3000) {
      recommendations.push('Consider optimizing app launch sequence');
    }
    
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected - review for memory leaks');
    }
    
    if (this.metrics.apiResponseTime > 2000) {
      recommendations.push('API response times are slow - consider caching or optimization');
    }
    
    return recommendations;
  }
}

// Usage
const performanceMonitor = new MobilePerformanceMonitor();

// In your navigation system
performanceMonitor.onScreenChange('UserProfile');

// Generate periodic reports
setInterval(() => {
  const report = performanceMonitor.generatePerformanceReport();
  console.log('Performance Report:', report);
}, 300000); // Every 5 minutes
\`\`\`

This comprehensive performance optimization guide provides production-ready strategies for building high-performance mobile applications across all platforms.`;
  }

  setupMobileTesting(analysis) {
    return `# Mobile Testing Strategy and Implementation

## Mobile Testing Framework

### iOS Testing with XCTest
\`\`\`swift
// Unit Testing
import XCTest
@testable import MyApp

class UserServiceTests: XCTestCase {
    var sut: UserService!
    var mockApiClient: MockApiClient!
    
    override func setUpWithError() throws {
        mockApiClient = MockApiClient()
        sut = UserService(apiClient: mockApiClient)
    }
    
    override func tearDownWithError() throws {
        sut = nil
        mockApiClient = nil
    }
    
    func testFetchUsers_Success() async throws {
        // Given
        let expectedUsers = [
            User(id: 1, name: "John Doe", email: "john@example.com"),
            User(id: 2, name: "Jane Smith", email: "jane@example.com")
        ]
        mockApiClient.getUsersResult = .success(expectedUsers)
        
        // When
        let result = try await sut.fetchUsers()
        
        // Then
        XCTAssertEqual(result.count, 2)
        XCTAssertEqual(result[0].name, "John Doe")
        XCTAssertEqual(result[1].name, "Jane Smith")
    }
    
    func testFetchUsers_NetworkError() async {
        // Given
        mockApiClient.getUsersResult = .failure(NetworkError.connectionLost)
        
        // When/Then
        do {
            _ = try await sut.fetchUsers()
            XCTFail("Expected error to be thrown")
        } catch {
            XCTAssertTrue(error is NetworkError)
        }
    }
}

// UI Testing
class UserListUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI_TESTING"]
        app.launch()
    }
    
    func testUserListDisplaysUsers() throws {
        // Wait for user list to load
        let userList = app.tables["UserList"]
        XCTAssertTrue(userList.waitForExistence(timeout: 5))
        
        // Verify users are displayed
        let firstUser = userList.cells.element(boundBy: 0)
        XCTAssertTrue(firstUser.exists)
        
        // Verify user information
        XCTAssertTrue(firstUser.staticTexts["John Doe"].exists)
        XCTAssertTrue(firstUser.staticTexts["john@example.com"].exists)
    }
    
    func testUserTapNavigatesToDetail() throws {
        let userList = app.tables["UserList"]
        XCTAssertTrue(userList.waitForExistence(timeout: 5))
        
        // Tap first user
        let firstUser = userList.cells.element(boundBy: 0)
        firstUser.tap()
        
        // Verify navigation to detail screen
        let detailScreen = app.navigationBars["User Detail"]
        XCTAssertTrue(detailScreen.waitForExistence(timeout: 3))
    }
    
    func testPullToRefreshUpdatesData() throws {
        let userList = app.tables["UserList"]
        XCTAssertTrue(userList.waitForExistence(timeout: 5))
        
        // Perform pull to refresh
        let firstCell = userList.cells.element(boundBy: 0)
        let start = firstCell.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        let finish = firstCell.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 10))
        start.press(forDuration: 0, thenDragTo: finish)
        
        // Verify refresh indicator appears
        let refreshIndicator = app.activityIndicators.element
        XCTAssertTrue(refreshIndicator.exists)
    }
}

// Performance Testing
class PerformanceTests: XCTestCase {
    func testUserListScrollPerformance() {
        let app = XCUIApplication()
        app.launch()
        
        let userList = app.tables["UserList"]
        XCTAssertTrue(userList.waitForExistence(timeout: 5))
        
        // Measure scroll performance
        measure(metrics: [XCTOSSignpostMetric.scrollingAndDecelerationMetric]) {
            userList.swipeUp(velocity: .fast)
            userList.swipeDown(velocity: .fast)
        }
    }
    
    func testAppLaunchPerformance() {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
\`\`\`

### Android Testing with Espresso and JUnit
\`\`\`kotlin
// Unit Testing
class UserViewModelTest {
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()
    
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()
    
    private lateinit var viewModel: UserViewModel
    private lateinit var mockRepository: UserRepository
    
    @Before
    fun setup() {
        mockRepository = mockk()
        viewModel = UserViewModel(mockRepository)
    }
    
    @Test
    fun \`loadUsers success updates uiState with users\`() = runTest {
        // Given
        val expectedUsers = listOf(
            User(1, "John Doe", "john@example.com"),
            User(2, "Jane Smith", "jane@example.com")
        )
        coEvery { mockRepository.getUsers() } returns expectedUsers
        
        // When
        viewModel.loadUsers()
        advanceUntilIdle()
        
        // Then
        val uiState = viewModel.uiState.value
        assertThat(uiState.users).isEqualTo(expectedUsers)
        assertThat(uiState.isLoading).isFalse()
        assertThat(uiState.error).isNull()
    }
    
    @Test
    fun \`loadUsers failure updates uiState with error\`() = runTest {
        // Given
        val errorMessage = "Network error"
        coEvery { mockRepository.getUsers() } throws Exception(errorMessage)
        
        // When
        viewModel.loadUsers()
        advanceUntilIdle()
        
        // Then
        val uiState = viewModel.uiState.value
        assertThat(uiState.users).isEmpty()
        assertThat(uiState.isLoading).isFalse()
        assertThat(uiState.error).isEqualTo(errorMessage)
    }
}

// UI Testing with Compose
@HiltAndroidTest
class UserListScreenTest {
    @get:Rule(order = 0)
    var hiltRule = HiltAndroidRule(this)
    
    @get:Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()
    
    @Before
    fun setup() {
        hiltRule.inject()
    }
    
    @Test
    fun userListDisplaysUsers() {
        composeTestRule.setContent {
            UserListScreen()
        }
        
        // Wait for loading to complete
        composeTestRule.waitUntil(timeoutMillis = 5000) {
            composeTestRule
                .onAllNodesWithText("Loading...")
                .fetchSemanticsNodes().isEmpty()
        }
        
        // Verify users are displayed
        composeTestRule
            .onNodeWithText("John Doe")
            .assertIsDisplayed()
        
        composeTestRule
            .onNodeWithText("john@example.com")
            .assertIsDisplayed()
    }
    
    @Test
    fun clickingUserNavigatesToDetail() {
        composeTestRule.setContent {
            UserListScreen()
        }
        
        // Wait for users to load
        composeTestRule.waitForIdle()
        
        // Click on first user
        composeTestRule
            .onNodeWithText("John Doe")
            .performClick()
        
        // Verify navigation to detail screen
        composeTestRule
            .onNodeWithText("User Details")
            .assertIsDisplayed()
    }
    
    @Test
    fun pullToRefreshUpdatesData() {
        composeTestRule.setContent {
            UserListScreen()
        }
        
        // Perform pull to refresh
        composeTestRule
            .onNodeWithTag("user_list")
            .performTouchInput {
                swipeDown()
            }
        
        // Verify refresh indicator appears
        composeTestRule
            .onNode(hasProgressBarRangeInfo(ProgressBarRangeInfo.Indeterminate))
            .assertExists()
    }
}

// Integration Testing
@RunWith(AndroidJUnit4::class)
@LargeTest
class UserIntegrationTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @Test
    fun completeUserJourney() {
        // Launch app and verify user list
        onView(withId(R.id.user_list))
            .check(matches(isDisplayed()))
        
        // Wait for users to load
        onView(withText("John Doe"))
            .check(matches(isDisplayed()))
        
        // Tap on user
        onView(withText("John Doe"))
            .perform(click())
        
        // Verify detail screen
        onView(withId(R.id.user_detail))
            .check(matches(isDisplayed()))
        
        // Verify user details
        onView(withText("john@example.com"))
            .check(matches(isDisplayed()))
        
        // Navigate back
        Espresso.pressBack()
        
        // Verify return to list
        onView(withId(R.id.user_list))
            .check(matches(isDisplayed()))
    }
}
\`\`\`

### React Native Testing with Jest and Detox
\`\`\`javascript
// Unit Testing with Jest
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../store';
import UserListScreen from '../UserListScreen';

// Mock API
jest.mock('../api/userApi', () => ({
  useGetUsersQuery: () => ({
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn()
  })
}));

describe('UserListScreen', () => {
  const renderWithProvider = (component) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };
  
  test('renders user list correctly', async () => {
    const { getByText, getByTestId } = renderWithProvider(<UserListScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('jane@example.com')).toBeTruthy();
    });
  });
  
  test('handles user tap correctly', async () => {
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({ navigate: mockNavigate })
    }));
    
    const { getByText } = renderWithProvider(<UserListScreen />);
    
    await waitFor(() => {
      const userItem = getByText('John Doe');
      fireEvent.press(userItem);
      expect(mockNavigate).toHaveBeenCalledWith('UserDetail', { userId: 1 });
    });
  });
  
  test('handles pull to refresh', async () => {
    const mockRefetch = jest.fn();
    
    const { getByTestId } = renderWithProvider(<UserListScreen />);
    
    const flatList = getByTestId('user-list');
    fireEvent(flatList, 'refresh');
    
    expect(mockRefetch).toHaveBeenCalled();
  });
});

// E2E Testing with Detox
describe('User Management Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should display user list on app launch', async () => {
    await expect(element(by.id('user-list'))).toBeVisible();
    await expect(element(by.text('John Doe'))).toBeVisible();
    await expect(element(by.text('jane@example.com'))).toBeVisible();
  });
  
  it('should navigate to user detail when user is tapped', async () => {
    await element(by.text('John Doe')).tap();
    await expect(element(by.id('user-detail'))).toBeVisible();
    await expect(element(by.text('john@example.com'))).toBeVisible();
  });
  
  it('should refresh user list when pulled down', async () => {
    await element(by.id('user-list')).swipe('down', 'slow');
    await expect(element(by.text('Refreshing...'))).toBeVisible();
    await waitFor(element(by.text('Refreshing...'))).not.toBeVisible().withTimeout(5000);
  });
  
  it('should handle network error gracefully', async () => {
    // Simulate network error
    await device.setURLBlacklist(['**/api/users']);
    
    await element(by.id('retry-button')).tap();
    await expect(element(by.text('Network error'))).toBeVisible();
    
    // Restore network
    await device.setURLBlacklist([]);
  });
  
  it('should maintain scroll position after background/foreground', async () => {
    // Scroll down to middle of list
    await element(by.id('user-list')).scroll(300, 'down');
    
    // Put app in background and bring back
    await device.sendToHome();
    await device.launchApp({ newInstance: false });
    
    // Verify scroll position maintained
    await expect(element(by.text('User 15'))).toBeVisible();
  });
});

// Performance Testing
describe('Performance Tests', () => {
  it('should scroll smoothly through large list', async () => {
    // Load app with large dataset
    await device.launchApp({ 
      newInstance: true,
      launchArgs: { mockLargeDataset: true }
    });
    
    // Measure scroll performance
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await element(by.id('user-list')).scroll(200, 'down');
      await sleep(100);
    }
    
    const scrollTime = Date.now() - startTime;
    expect(scrollTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });
  
  it('should launch app within acceptable time', async () => {
    const startTime = Date.now();
    await device.launchApp({ newInstance: true });
    await expect(element(by.id('user-list'))).toBeVisible();
    const launchTime = Date.now() - startTime;
    
    expect(launchTime).toBeLessThan(3000); // Should launch in under 3 seconds
  });
});
\`\`\`

### Flutter Testing with flutter_test
\`\`\`dart
// Unit Testing
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:bloc_test/bloc_test.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  group('UserBloc', () {
    late UserBloc userBloc;
    late MockUserRepository mockRepository;
    
    setUp(() {
      mockRepository = MockUserRepository();
      userBloc = UserBloc(userRepository: mockRepository);
    });
    
    tearDown(() {
      userBloc.close();
    });
    
    test('initial state is UserInitial', () {
      expect(userBloc.state, equals(UserInitial()));
    });
    
    blocTest<UserBloc, UserState>(
      'emits [UserLoading, UserLoaded] when LoadUsers is successful',
      build: () {
        when(mockRepository.getUsers()).thenAnswer(
          (_) async => [
            User(id: 1, name: 'John Doe', email: 'john@example.com'),
            User(id: 2, name: 'Jane Smith', email: 'jane@example.com'),
          ],
        );
        return userBloc;
      },
      act: (bloc) => bloc.add(LoadUsers()),
      expect: () => [
        UserLoading(),
        isA<UserLoaded>().having(
          (state) => state.users.length,
          'user count',
          2,
        ),
      ],
    );
    
    blocTest<UserBloc, UserState>(
      'emits [UserLoading, UserError] when LoadUsers fails',
      build: () {
        when(mockRepository.getUsers()).thenThrow(Exception('Network error'));
        return userBloc;
      },
      act: (bloc) => bloc.add(LoadUsers()),
      expect: () => [
        UserLoading(),
        isA<UserError>().having(
          (state) => state.message,
          'error message',
          contains('Network error'),
        ),
      ],
    );
  });
}

// Widget Testing
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mockito/mockito.dart';

void main() {
  group('UserListPage Widget Tests', () {
    late MockUserBloc mockUserBloc;
    
    setUp(() {
      mockUserBloc = MockUserBloc();
    });
    
    testWidgets('displays loading indicator when state is UserLoading', (tester) async {
      when(mockUserBloc.state).thenReturn(UserLoading());
      when(mockUserBloc.stream).thenAnswer((_) => Stream.empty());
      
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<UserBloc>(
            create: (_) => mockUserBloc,
            child: UserListPage(),
          ),
        ),
      );
      
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading users...'), findsOneWidget);
    });
    
    testWidgets('displays user list when state is UserLoaded', (tester) async {
      final users = [
        User(id: 1, name: 'John Doe', email: 'john@example.com'),
        User(id: 2, name: 'Jane Smith', email: 'jane@example.com'),
      ];
      
      when(mockUserBloc.state).thenReturn(UserLoaded(users));
      when(mockUserBloc.stream).thenAnswer((_) => Stream.empty());
      
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<UserBloc>(
            create: (_) => mockUserBloc,
            child: UserListPage(),
          ),
        ),
      );
      
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('jane@example.com'), findsOneWidget);
      expect(find.byType(ListView), findsOneWidget);
    });
    
    testWidgets('displays error message when state is UserError', (tester) async {
      when(mockUserBloc.state).thenReturn(UserError('Network error'));
      when(mockUserBloc.stream).thenAnswer((_) => Stream.empty());
      
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<UserBloc>(
            create: (_) => mockUserBloc,
            child: UserListPage(),
          ),
        ),
      );
      
      expect(find.text('Network error'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
      expect(find.byIcon(Icons.error), findsOneWidget);
    });
    
    testWidgets('taps retry button triggers LoadUsers event', (tester) async {
      when(mockUserBloc.state).thenReturn(UserError('Network error'));
      when(mockUserBloc.stream).thenAnswer((_) => Stream.empty());
      
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<UserBloc>(
            create: (_) => mockUserBloc,
            child: UserListPage(),
          ),
        ),
      );
      
      await tester.tap(find.text('Retry'));
      
      verify(mockUserBloc.add(LoadUsers())).called(1);
    });
  });
}

// Integration Testing
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('User Management Integration Tests', () {
    testWidgets('complete user journey flow', (tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      // Verify app launches and displays user list
      expect(find.text('Users'), findsOneWidget);
      await tester.pumpAndSettle(Duration(seconds: 2));
      
      // Verify users are loaded
      expect(find.text('John Doe'), findsOneWidget);
      
      // Tap on user to navigate to detail
      await tester.tap(find.text('John Doe'));
      await tester.pumpAndSettle();
      
      // Verify navigation to detail screen
      expect(find.text('User Details'), findsOneWidget);
      expect(find.text('john@example.com'), findsOneWidget);
      
      // Navigate back
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();
      
      // Verify return to list
      expect(find.text('Users'), findsOneWidget);
    });
    
    testWidgets('pull to refresh functionality', (tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      // Find the list view
      final listViewFinder = find.byType(ListView);
      expect(listViewFinder, findsOneWidget);
      
      // Perform pull to refresh
      await tester.fling(listViewFinder, Offset(0, 300), 1000);
      await tester.pump();
      
      // Verify refresh indicator appears
      expect(find.byType(RefreshIndicator), findsOneWidget);
      
      // Wait for refresh to complete
      await tester.pumpAndSettle(Duration(seconds: 3));
    });
    
    testWidgets('app handles network errors gracefully', (tester) async {
      // Configure app to simulate network error
      app.main();
      await tester.pumpAndSettle();
      
      // Trigger network error scenario
      // (This would require mocking network calls in your app)
      
      // Verify error state is displayed
      expect(find.text('Network error'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
      
      // Tap retry button
      await tester.tap(find.text('Retry'));
      await tester.pumpAndSettle();
    });
  });
  
  group('Performance Tests', () {
    testWidgets('app launches within acceptable time', (tester) async {
      final stopwatch = Stopwatch()..start();
      
      app.main();
      await tester.pumpAndSettle();
      
      // Wait for initial content to load
      expect(find.text('Users'), findsOneWidget);
      
      stopwatch.stop();
      
      // Verify launch time is under 3 seconds
      expect(stopwatch.elapsedMilliseconds, lessThan(3000));
    });
    
    testWidgets('smooth scrolling performance', (tester) async {
      app.main();
      await tester.pumpAndSettle();
      
      final listViewFinder = find.byType(ListView);
      
      // Perform multiple scroll operations
      for (int i = 0; i < 10; i++) {
        await tester.fling(listViewFinder, Offset(0, -200), 800);
        await tester.pump(Duration(milliseconds: 16)); // 60 FPS
      }
      
      // Verify smooth scrolling (no frame drops)
      // This would require additional performance monitoring
    });
  });
}
\`\`\`

## Test Automation CI/CD Integration

### GitHub Actions Mobile Testing Pipeline
\`\`\`yaml
name: Mobile Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  ios-tests:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: '15.0'
    
    - name: Install dependencies
      run: |
        cd ios
        pod install
    
    - name: Run unit tests
      run: |
        xcodebuild test \
          -workspace ios/MyApp.xcworkspace \
          -scheme MyApp \
          -destination 'platform=iOS Simulator,name=iPhone 14,OS=17.0' \
          -enableCodeCoverage YES
    
    - name: Run UI tests
      run: |
        xcodebuild test \
          -workspace ios/MyApp.xcworkspace \
          -scheme MyAppUITests \
          -destination 'platform=iOS Simulator,name=iPhone 14,OS=17.0'
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: ios-test-results
        path: ios/test-results/
  
  android-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Cache Gradle dependencies
      uses: actions/cache@v3
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: \${{ runner.os }}-gradle-\${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
    
    - name: Run unit tests
      run: ./gradlew testDebugUnitTest
    
    - name: Run instrumented tests
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 30
        target: google_apis
        arch: x86_64
        script: ./gradlew connectedAndroidTest
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: android-test-results
        path: app/build/reports/tests/
  
  react-native-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test -- --coverage --watchAll=false
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: Build for testing
      run: |
        npm run build:android
        npm run build:ios
    
    - name: Run E2E tests
      run: |
        npm run detox:build
        npm run detox:test
  
  flutter-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Flutter
      uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.16.0'
        cache: true
    
    - name: Install dependencies
      run: flutter pub get
    
    - name: Analyze code
      run: flutter analyze
    
    - name: Run unit tests
      run: flutter test --coverage
    
    - name: Run integration tests
      run: flutter test integration_test/
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
\`\`\`

This comprehensive mobile testing framework provides robust testing strategies for all major mobile platforms with automated CI/CD integration.`;
  }

  async troubleshoot(issue) {
    const solutions = {
      performance_issues: [
        'Profile app using platform-specific tools (Instruments, Android Profiler)',
        'Optimize image loading and caching strategies',
        'Implement lazy loading and virtualized lists',
        'Review memory management and eliminate leaks',
        'Optimize network requests and implement caching'
      ],
      cross_platform_inconsistencies: [
        'Review platform-specific design guidelines',
        'Implement platform-adaptive components',
        'Use platform-specific navigation patterns',
        'Test on multiple devices and screen sizes',
        'Consider native modules for complex features'
      ],
      build_deployment_issues: [
        'Verify platform-specific configuration files',
        'Check code signing and provisioning profiles',
        'Review app store submission requirements',
        'Test on physical devices before submission',
        'Implement automated build and deployment pipelines'
      ],
      testing_challenges: [
        'Implement comprehensive testing strategy',
        'Use platform-specific testing frameworks',
        'Set up automated testing in CI/CD pipeline',
        'Include performance and accessibility testing',
        'Test offline functionality and edge cases'
      ]
    };
    
    return solutions[issue.type] || ['Review platform documentation and best practices'];
  }
}

module.exports = MobileDevelopmentSpecialist;