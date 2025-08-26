/**
 * BUMBA Mobile & Frontend Specialists Expertise
 * Enhanced knowledge for Mobile Development, Frontend Engineering, and UI/UX Design specialists
 * Sprint 17 Implementation
 */

class MobileFrontendExpertise {
  /**
   * Mobile Development Expert Knowledge
   */
  static getMobileDevelopmentExpertise() {
    return {
      name: 'Mobile Development Expert',
      expertise: {
        core: {
          native_development: 'iOS Swift/SwiftUI, Android Kotlin/Jetpack Compose, platform-specific APIs',
          cross_platform: 'React Native, Flutter, Xamarin, Ionic, hybrid development strategies',
          mobile_architecture: 'MVVM, MVP, Clean Architecture, reactive programming, state management',
          performance: 'App performance optimization, memory management, battery efficiency, rendering',
          deployment: 'App Store deployment, Google Play Store, CI/CD pipelines, automated testing'
        },
        
        ios: {
          languages: 'Swift 5.9+, SwiftUI, UIKit, Objective-C interop, Combine framework',
          frameworks: 'Foundation, Core Data, Core Animation, AVFoundation, CloudKit',
          tools: 'Xcode, Instruments, TestFlight, Fastlane, CocoaPods, Swift Package Manager',
          apis: 'Core Location, Core Bluetooth, HealthKit, ARKit, Core ML, Push Notifications'
        },
        
        android: {
          languages: 'Kotlin, Java, Jetpack Compose, Android Views, Coroutines',
          frameworks: 'Android Jetpack, Room, WorkManager, Navigation, ViewModel, LiveData',
          tools: 'Android Studio, Gradle, Firebase, Google Play Console, ProGuard/R8',
          apis: 'Location Services, Camera2, Bluetooth, ML Kit, Firebase, Push Notifications'
        },
        
        cross_platform: {
          react_native: 'React Native 0.72+, Expo, React Navigation, Redux/Zustand, native modules',
          flutter: 'Flutter 3.16+, Dart, Provider/Bloc, Flutter Web, platform channels',
          tools: 'Metro bundler, Flipper, React Native Debugger, Flutter DevTools',
          deployment: 'CodePush, Fastlane, EAS Build, Firebase App Distribution'
        },
        
        mobile_specific: {
          ui_ux: 'Material Design, Human Interface Guidelines, responsive design, accessibility',
          testing: 'Unit testing, UI testing, integration testing, device testing, cloud testing',
          security: 'App security, data encryption, secure storage, biometric authentication',
          offline: 'Offline-first architecture, data synchronization, caching strategies'
        }
      },
      
      capabilities: [
        'Native iOS development with Swift/SwiftUI',
        'Native Android development with Kotlin/Compose',
        'Cross-platform development with React Native/Flutter',
        'Mobile app architecture and design patterns',
        'Performance optimization and memory management',
        'Mobile UI/UX design and accessibility',
        'App Store and Google Play deployment',
        'Mobile testing strategies and automation',
        'Offline-first mobile architecture',
        'Mobile security and data protection',
        'Push notifications and real-time features',
        'Mobile analytics and crash reporting',
        'CI/CD pipelines for mobile apps',
        'Mobile app monetization strategies',
        'Progressive Web Apps (PWA) development',
        'Mobile backend integration and APIs'
      ],
      
      systemPromptAdditions: `
You are a Mobile Development expert specializing in:
- Native iOS development with Swift, SwiftUI, and iOS frameworks
- Native Android development with Kotlin, Jetpack Compose, and Android APIs
- Cross-platform development with React Native and Flutter
- Mobile app architecture, performance optimization, and security
- App Store deployment, testing strategies, and mobile DevOps
- Mobile UI/UX design following platform guidelines
- Offline-first architecture and data synchronization

Always consider platform-specific guidelines, performance implications, and user experience best practices.`,

      bestPractices: [
        'Follow platform-specific design guidelines (HIG/Material Design)',
        'Implement offline-first architecture with data synchronization',
        'Optimize app performance and minimize battery usage',
        'Use proper state management and reactive programming patterns',
        'Implement comprehensive testing strategy (unit, integration, UI)',
        'Follow security best practices for mobile applications',
        'Design for accessibility and internationalization',
        'Use CI/CD pipelines for automated testing and deployment',
        'Monitor app performance and crash reporting',
        'Implement proper error handling and user feedback',
        'Use proper navigation patterns and user flows',
        'Optimize app size and startup time',
        'Implement proper data caching and synchronization',
        'Follow app store guidelines and review processes',
        'Use analytics to understand user behavior and app performance'
      ],
      
      codePatterns: {
        swiftUIApp: `
# SwiftUI iOS Application Architecture

## Main App Structure
\`\`\`swift
import SwiftUI
import Combine

@main
struct MyApp: App {
    let persistenceController = PersistenceController.shared
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(appState)
                .onAppear {
                    configureApp()
                }
        }
    }
    
    private func configureApp() {
        // Configure Firebase, analytics, etc.
        FirebaseApp.configure()
        setupAppearances()
    }
}

// MARK: - App State Management
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var networkStatus: NetworkStatus = .unknown
    
    private let authService = AuthenticationService()
    private let networkMonitor = NetworkMonitor()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupBindings()
        checkAuthenticationStatus()
    }
    
    private func setupBindings() {
        authService.currentUser
            .assign(to: &$currentUser)
        
        authService.isAuthenticated
            .assign(to: &$isAuthenticated)
        
        networkMonitor.status
            .assign(to: &$networkStatus)
    }
    
    func signIn(email: String, password: String) async {
        do {
            try await authService.signIn(email: email, password: password)
        } catch {
            handleError(error)
        }
    }
    
    private func handleError(_ error: Error) {
        // Handle and present errors to user
        print("App error: \\(error.localizedDescription)")
    }
}
\`\`\`

## SwiftUI Views with MVVM
\`\`\`swift
// MARK: - Content View
struct ContentView: View {
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        Group {
            if appState.isAuthenticated {
                MainTabView()
            } else {
                AuthenticationView()
            }
        }
        .animation(.easeInOut, value: appState.isAuthenticated)
    }
}

// MARK: - Product List View with ViewModel
struct ProductListView: View {
    @StateObject private var viewModel = ProductListViewModel()
    @State private var searchText = ""
    
    var body: some View {
        NavigationView {
            VStack {
                SearchBar(text: $searchText)
                    .onChange(of: searchText) { newValue in
                        viewModel.searchProducts(query: newValue)
                    }
                
                if viewModel.isLoading {
                    ProgressView("Loading products...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ProductGrid(products: viewModel.filteredProducts) { product in
                        viewModel.selectProduct(product)
                    }
                }
            }
            .navigationTitle("Products")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Filter") {
                        viewModel.showFilterSheet.toggle()
                    }
                }
            }
            .sheet(isPresented: $viewModel.showFilterSheet) {
                FilterView(filters: $viewModel.filters)
            }
            .alert("Error", isPresented: $viewModel.hasError) {
                Button("OK") { }
            } message: {
                Text(viewModel.errorMessage)
            }
        }
        .task {
            await viewModel.loadProducts()
        }
    }
}

// MARK: - ViewModel
@MainActor
class ProductListViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var filteredProducts: [Product] = []
    @Published var isLoading = false
    @Published var hasError = false
    @Published var errorMessage = ""
    @Published var showFilterSheet = false
    @Published var filters = ProductFilters()
    
    private let productService = ProductService()
    private var searchTask: Task<Void, Never>?
    
    func loadProducts() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let fetchedProducts = try await productService.fetchProducts()
            products = fetchedProducts
            filteredProducts = fetchedProducts
        } catch {
            handleError(error)
        }
    }
    
    func searchProducts(query: String) {
        searchTask?.cancel()
        
        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000) // Debounce
            
            if !Task.isCancelled {
                if query.isEmpty {
                    filteredProducts = products
                } else {
                    filteredProducts = products.filter { product in
                        product.name.localizedCaseInsensitiveContains(query)
                    }
                }
            }
        }
    }
    
    func selectProduct(_ product: Product) {
        // Navigate to product detail
    }
    
    private func handleError(_ error: Error) {
        errorMessage = error.localizedDescription
        hasError = true
    }
}
\`\`\`

## Core Data Integration
\`\`\`swift
// MARK: - Persistence Controller
class PersistenceController {
    static let shared = PersistenceController()
    
    let container: NSPersistentContainer
    
    init() {
        container = NSPersistentContainer(name: "DataModel")
        
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Core Data error: \\(error.localizedDescription)")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
    
    func save() {
        let context = container.viewContext
        
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Save error: \\(error.localizedDescription)")
            }
        }
    }
}

// MARK: - Repository Pattern
protocol ProductRepositoryProtocol {
    func fetchProducts() async throws -> [Product]
    func saveProduct(_ product: Product) async throws
    func deleteProduct(_ product: Product) async throws
}

class CoreDataProductRepository: ProductRepositoryProtocol {
    private let context: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.context = context
    }
    
    func fetchProducts() async throws -> [Product] {
        let request: NSFetchRequest<ProductEntity> = ProductEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \\ProductEntity.name, ascending: true)]
        
        let entities = try context.fetch(request)
        return entities.map { Product(from: $0) }
    }
    
    func saveProduct(_ product: Product) async throws {
        let entity = ProductEntity(context: context)
        entity.update(from: product)
        
        try context.save()
    }
    
    func deleteProduct(_ product: Product) async throws {
        let request: NSFetchRequest<ProductEntity> = ProductEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", product.id as CVarArg)
        
        let entities = try context.fetch(request)
        entities.forEach { context.delete($0) }
        
        try context.save()
    }
}
\`\`\``,

        androidKotlinApp: `
# Android Kotlin with Jetpack Compose

## Application Architecture
\`\`\`kotlin
// Application Class
class MyApplication : Application() {
    
    // Database instance
    val database by lazy { AppDatabase.getDatabase(this) }
    
    // Repository instance
    val repository by lazy { ProductRepository(database.productDao()) }
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize Firebase
        FirebaseApp.initializeApp(this)
        
        // Initialize other SDKs
        initializeAnalytics()
        initializeCrashReporting()
    }
    
    private fun initializeAnalytics() {
        // Initialize analytics SDK
    }
    
    private fun initializeCrashReporting() {
        // Initialize crash reporting
    }
}

// Main Activity with Compose
class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels {
        MainViewModelFactory((application as MyApplication).repository)
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            MyAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MyAppNavigation(viewModel = viewModel)
                }
            }
        }
    }
}
\`\`\`

## Jetpack Compose UI
\`\`\`kotlin
// Main Navigation
@Composable
fun MyAppNavigation(viewModel: MainViewModel) {
    val navController = rememberNavController()
    val uiState by viewModel.uiState.collectAsState()
    
    NavHost(
        navController = navController,
        startDestination = if (uiState.isAuthenticated) "home" else "auth"
    ) {
        composable("auth") {
            AuthenticationScreen(
                onAuthSuccess = {
                    navController.navigate("home") {
                        popUpTo("auth") { inclusive = true }
                    }
                }
            )
        }
        
        composable("home") {
            HomeScreen(
                navController = navController,
                viewModel = viewModel
            )
        }
        
        composable("products") {
            ProductListScreen(
                onProductClick = { productId ->
                    navController.navigate("product_detail/\$productId")
                },
                onBackClick = { navController.popBackStack() }
            )
        }
        
        composable(
            "product_detail/{productId}",
            arguments = listOf(navArgument("productId") { type = NavType.StringType })
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: ""
            ProductDetailScreen(
                productId = productId,
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}

// Product List Screen with ViewModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductListScreen(
    onProductClick: (String) -> Unit,
    onBackClick: () -> Unit,
    viewModel: ProductListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    
    LaunchedEffect(Unit) {
        viewModel.loadProducts()
    }
    
    LaunchedEffect(searchQuery) {
        viewModel.searchProducts(searchQuery)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Products") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.showFilterDialog() }) {
                        Icon(Icons.Default.FilterList, contentDescription = "Filter")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Search products...") },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Search")
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                }
            )
            
            // Content
            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                
                uiState.error != null -> {
                    ErrorMessage(
                        message = uiState.error,
                        onRetry = { viewModel.loadProducts() }
                    )
                }
                
                uiState.products.isEmpty() -> {
                    EmptyState(
                        message = "No products found",
                        modifier = Modifier.fillMaxSize()
                    )
                }
                
                else -> {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.filteredProducts) { product ->
                            ProductCard(
                                product = product,
                                onClick = { onProductClick(product.id) }
                            )
                        }
                    }
                }
            }
        }
    }
    
    // Filter Dialog
    if (uiState.showFilterDialog) {
        FilterDialog(
            filters = uiState.filters,
            onFiltersChanged = { viewModel.updateFilters(it) },
            onDismiss = { viewModel.hideFilterDialog() }
        )
    }
}

// Product Card Component
@Composable
fun ProductCard(
    product: Product,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            AsyncImage(
                model = product.imageUrl,
                contentDescription = product.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop,
                placeholder = painterResource(id = R.drawable.placeholder_image),
                error = painterResource(id = R.drawable.error_image)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = product.name,
                style = MaterialTheme.typography.titleMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = "\\$\${product.price}",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary
            )
            
            if (product.rating > 0) {
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Star,
                        contentDescription = "Rating",
                        tint = Color(0xFFFFD700),
                        modifier = Modifier.size(16.dp)
                    )
                    
                    Spacer(modifier = Modifier.width(4.dp))
                    
                    Text(
                        text = product.rating.toString(),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}
\`\`\`

## ViewModel with State Management
\`\`\`kotlin
// Product List ViewModel
@HiltViewModel
class ProductListViewModel @Inject constructor(
    private val productRepository: ProductRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ProductListUiState())
    val uiState: StateFlow<ProductListUiState> = _uiState.asStateFlow()
    
    private var searchJob: Job? = null
    
    fun loadProducts() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                val products = productRepository.getProducts()
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        products = products,
                        filteredProducts = products
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Unknown error occurred"
                    )
                }
            }
        }
    }
    
    fun searchProducts(query: String) {
        searchJob?.cancel()
        
        searchJob = viewModelScope.launch {
            delay(300) // Debounce
            
            val filtered = if (query.isBlank()) {
                _uiState.value.products
            } else {
                _uiState.value.products.filter { product ->
                    product.name.contains(query, ignoreCase = true) ||
                    product.description.contains(query, ignoreCase = true)
                }
            }
            
            _uiState.update { it.copy(filteredProducts = filtered) }
        }
    }
    
    fun updateFilters(filters: ProductFilters) {
        _uiState.update { it.copy(filters = filters) }
        applyFilters()
    }
    
    fun showFilterDialog() {
        _uiState.update { it.copy(showFilterDialog = true) }
    }
    
    fun hideFilterDialog() {
        _uiState.update { it.copy(showFilterDialog = false) }
    }
    
    private fun applyFilters() {
        val filters = _uiState.value.filters
        val filtered = _uiState.value.products.filter { product ->
            val priceInRange = product.price >= filters.minPrice && 
                              product.price <= filters.maxPrice
            val categoryMatches = filters.selectedCategories.isEmpty() || 
                                filters.selectedCategories.contains(product.category)
            val ratingMatches = product.rating >= filters.minRating
            
            priceInRange && categoryMatches && ratingMatches
        }
        
        _uiState.update { it.copy(filteredProducts = filtered) }
    }
}

// UI State Data Class
data class ProductListUiState(
    val isLoading: Boolean = false,
    val products: List<Product> = emptyList(),
    val filteredProducts: List<Product> = emptyList(),
    val error: String? = null,
    val showFilterDialog: Boolean = false,
    val filters: ProductFilters = ProductFilters()
)

data class ProductFilters(
    val minPrice: Double = 0.0,
    val maxPrice: Double = Double.MAX_VALUE,
    val selectedCategories: Set<String> = emptySet(),
    val minRating: Float = 0f
)
\`\`\`

## Room Database Integration
\`\`\`kotlin
// Entity
@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val imageUrl: String,
    val category: String,
    val rating: Float,
    val createdAt: Long = System.currentTimeMillis()
)

// DAO
@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY name ASC")
    fun getAllProducts(): Flow<List<ProductEntity>>
    
    @Query("SELECT * FROM products WHERE id = :id")
    suspend fun getProductById(id: String): ProductEntity?
    
    @Query("SELECT * FROM products WHERE name LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%'")
    suspend fun searchProducts(query: String): List<ProductEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProducts(products: List<ProductEntity>)
    
    @Update
    suspend fun updateProduct(product: ProductEntity)
    
    @Delete
    suspend fun deleteProduct(product: ProductEntity)
    
    @Query("DELETE FROM products")
    suspend fun deleteAllProducts()
}

// Database
@Database(
    entities = [ProductEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

// Repository
class ProductRepository @Inject constructor(
    private val productDao: ProductDao,
    private val apiService: ProductApiService
) {
    fun getAllProducts(): Flow<List<Product>> {
        return productDao.getAllProducts().map { entities ->
            entities.map { it.toProduct() }
        }
    }
    
    suspend fun refreshProducts() {
        try {
            val apiProducts = apiService.getProducts()
            val entities = apiProducts.map { it.toEntity() }
            productDao.insertProducts(entities)
        } catch (e: Exception) {
            // Handle error - maybe log or show user notification
            throw e
        }
    }
    
    suspend fun getProductById(id: String): Product? {
        return productDao.getProductById(id)?.toProduct()
    }
    
    suspend fun searchProducts(query: String): List<Product> {
        return productDao.searchProducts(query).map { it.toProduct() }
    }
}
\`\`\``,

        reactNativeApp: `
# React Native Cross-Platform Application

## App Structure and Navigation
\`\`\`typescript
// App.tsx - Main application component
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, persistor } from './src/store/store';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';
import { useAppSelector } from './src/hooks/redux';
import { LoadingScreen } from './src/components/LoadingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NotificationService } from './src/services/NotificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const Stack = createNativeStackNavigator();

function AppContent() {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    // Initialize services
    NotificationService.initialize();
    
    // Setup error tracking
    setupErrorTracking();
    
    // Setup analytics
    setupAnalytics();
  }, []);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <AppContent />
              <StatusBar style="auto" />
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function setupErrorTracking() {
  // Initialize crash reporting
  // Crashlytics.initialize();
}

function setupAnalytics() {
  // Initialize analytics
  // Analytics.initialize();
}
\`\`\`

## Redux Toolkit State Management
\`\`\`typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import productSlice from './slices/productSlice';
import cartSlice from './slices/cartSlice';
import { api } from './api/apiSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'cart'], // Only persist auth and cart
};

const rootReducer = combineReducers({
  auth: authSlice,
  products: productSlice,
  cart: cartSlice,
  [api.reducerPath]: api.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '../../services/AuthService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await AuthService.signIn(email, password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign in failed');
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }, { rejectWithValue }) => {
    try {
      const response = await AuthService.signUp(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign up failed');
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.signOut();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign out failed');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      })
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
\`\`\`

## Component Architecture
\`\`\`typescript
// components/ProductList/ProductList.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from '../ErrorMessage';
import { EmptyState } from '../EmptyState';
import { ProductService } from '../../services/ProductService';
import { Product } from '../../types/Product';
import { useDebounce } from '../../hooks/useDebounce';
import { colors, spacing, typography } from '../../theme';

interface ProductListProps {
  onProductPress: (product: Product) => void;
  category?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  onProductPress,
  category,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', category, debouncedSearchQuery],
    queryFn: () => ProductService.getProducts({
      category,
      search: debouncedSearchQuery,
    }),
    keepPreviousData: true,
  });
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  
  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => onProductPress(item)}
    />
  ), [onProductPress]);
  
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.text.secondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  
  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <EmptyState
          icon="search"
          title="No products found"
          subtitle={`No products match "\${searchQuery}"`}
          action={{
            label: 'Clear search',
            onPress: () => setSearchQuery(''),
          }}
        />
      );
    }
    
    return (
      <EmptyState
        icon="bag"
        title="No products available"
        subtitle="Check back later for new products"
      />
    );
  };
  
  if (isLoading && !products.length) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorMessage
        message="Failed to load products"
        onRetry={refetch}
      />
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          products.length === 0 && styles.emptyListContent,
        ]}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
  },
});

// components/ProductCard/ProductCard.tsx
import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Product } from '../../types/Product';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {product.isOnSale && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>SALE</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            \${product.price.toFixed(2)}
          </Text>
          {product.originalPrice && product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>
              \${product.originalPrice.toFixed(2)}
            </Text>
          )}
        </View>
        
        {product.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.rating}>
              {product.rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({product.reviewCount})
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 0.48,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  saleBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  saleText: {
    color: colors.background.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.sm,
  },
  name: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginLeft: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: typography.caption.fontSize,
    color: colors.text.primary,
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
});
\`\`\`
      }
    };
  }
  
  /**
   * Frontend Engineering Expert Knowledge
   */
  static getFrontendEngineeringExpertise() {
    return {
      name: 'Frontend Engineering Expert',
      expertise: {
        core: {
          modern_javascript: 'ES2024+, TypeScript, async/await, modules, web APIs, performance optimization',
          frameworks: 'React 18+, Vue 3+, Angular 17+, Svelte, Next.js, Nuxt.js, SvelteKit',
          build_tools: 'Vite, Webpack, Rollup, esbuild, SWC, Turbopack, module federation',
          styling: 'CSS3, Sass, PostCSS, CSS-in-JS, Tailwind CSS, CSS modules, design systems',
          testing: 'Jest, Vitest, Testing Library, Cypress, Playwright, Storybook, visual testing'
        },
        
        react_ecosystem: {
          core: 'React 18+, Hooks, Context, Suspense, Concurrent Features, Server Components',
          state_management: 'Redux Toolkit, Zustand, Jotai, React Query/TanStack Query, SWR',
          routing: 'React Router 6+, Next.js routing, Reach Router migration',
          styling: 'Styled Components, Emotion, CSS Modules, Tailwind CSS, Chakra UI',
          meta_frameworks: 'Next.js 14+, Remix, Gatsby, React Server Components'
        },
        
        vue_ecosystem: {
          core: 'Vue 3+, Composition API, Options API, Reactivity, Teleport, Fragments',
          state_management: 'Pinia, Vuex 4+, composables for state, reactive stores',
          routing: 'Vue Router 4+, nested routes, route guards, dynamic routing',
          styling: 'Vue SFC styles, CSS modules, styled-components for Vue',
          meta_frameworks: 'Nuxt 3+, VitePress, Quasar, Vue CLI to Vite migration'
        },
        
        modern_development: {
          typescript: 'Advanced TypeScript, generics, utility types, strict mode, declaration files',
          performance: 'Web Vitals, Core Web Vitals, bundle optimization, code splitting, lazy loading',
          accessibility: 'WCAG 2.1 AA, ARIA, semantic HTML, screen readers, keyboard navigation',
          pwa: 'Service Workers, Web App Manifest, offline strategies, push notifications',
          web_apis: 'Intersection Observer, Web Workers, WebAssembly, File API, Geolocation'
        }
      },
      
      capabilities: [
        'Modern JavaScript and TypeScript development',
        'React, Vue, and Angular framework expertise',
        'Component library and design system development',
        'Frontend build optimization and performance tuning',
        'Progressive Web App (PWA) development',
        'Accessibility (a11y) implementation and testing',
        'Frontend testing strategies and automation',
        'State management and data fetching patterns',
        'Responsive design and cross-browser compatibility',
        'Frontend architecture and code organization',
        'Modern CSS and styling methodologies',
        'Frontend security and best practices',
        'Developer experience (DX) optimization',
        'Code splitting and lazy loading strategies',
        'Frontend monitoring and error tracking',
        'SEO optimization and meta tag management'
      ],
      
      systemPromptAdditions: `
You are a Frontend Engineering expert specializing in:
- Modern JavaScript/TypeScript development with latest ECMAScript features
- React, Vue, and Angular framework development and optimization
- Frontend build tools, bundlers, and development workflow optimization
- Component libraries, design systems, and reusable UI development
- Frontend performance optimization and Core Web Vitals
- Accessibility (a11y) implementation and WCAG compliance
- Progressive Web Apps (PWA) and modern web capabilities

Always focus on modern best practices, performance, accessibility, and developer experience.`,

      bestPractices: [
        'Use TypeScript for type safety and better developer experience',
        'Implement proper component composition and reusability patterns',
        'Optimize bundle size with code splitting and tree shaking',
        'Follow accessibility guidelines (WCAG 2.1 AA) and semantic HTML',
        'Implement comprehensive testing strategy (unit, integration, e2e)',
        'Use modern CSS features and responsive design principles',
        'Optimize for Core Web Vitals and performance metrics',
        'Implement proper error boundaries and error handling',
        'Use consistent code formatting and linting (ESLint, Prettier)',
        'Follow component-driven development with Storybook',
        'Implement proper SEO optimization and meta tag management',
        'Use modern state management patterns and data fetching',
        'Implement security best practices (CSP, XSS prevention)',
        'Use proper version control and collaborative development workflows',
        'Monitor frontend performance and user experience metrics'
      ],
      
      codePatterns: {
        modernReactApp: `
# Modern React Application Architecture

## App Setup with TypeScript
\`\`\`typescript
// App.tsx - Main application component
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorFallback } from './components/ErrorFallback';

// Lazy load pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Routes>
                </Suspense>
              </Layout>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
\`\`\`

## Modern React Hooks and Components
\`\`\`typescript
// hooks/useProducts.ts - Custom hook for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import * as ProductService from '../services/productService';
import type { Product, ProductFilters } from '../types/product';

export function useProducts(initialFilters: ProductFilters = {}) {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const queryClient = useQueryClient();
  
  const {
    data: products = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => ProductService.getProducts(filters),
    keepPreviousData: true,
  });
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.minPrice && product.price < filters.minPrice) return false;
      if (filters.maxPrice && product.price > filters.maxPrice) return false;
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [products, filters]);
  
  const addToFavorites = useMutation({
    mutationFn: ProductService.addToFavorites,
    onSuccess: (_, productId) => {
      queryClient.setQueryData(['products', filters], (old: Product[] = []) =>
        old.map(product =>
          product.id === productId
            ? { ...product, isFavorite: true }
            : product
        )
      );
    },
  });
  
  const removeFromFavorites = useMutation({
    mutationFn: ProductService.removeFromFavorites,
    onSuccess: (_, productId) => {
      queryClient.setQueryData(['products', filters], (old: Product[] = []) =>
        old.map(product =>
          product.id === productId
            ? { ...product, isFavorite: false }
            : product
        )
      );
    },
  });
  
  return {
    products: filteredProducts,
    isLoading,
    error,
    isError,
    filters,
    setFilters,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    isAddingToFavorites: addToFavorites.isLoading,
    isRemovingFromFavorites: removeFromFavorites.isLoading,
  };
}

// components/ProductCard/ProductCard.tsx
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Product } from '../../types/product';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  isAddingToCart?: boolean;
  isTogglingFavorite?: boolean;
}

export const ProductCard = memo<ProductCardProps>(({
  product,
  onAddToCart,
  onToggleFavorite,
  isAddingToCart = false,
  isTogglingFavorite = false,
}) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart(product.id);
  };
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggleFavorite(product.id);
  };
  
  return (
    <Card className={styles.card}>
      <Link to={\`/products/\${product.id}\`} className={styles.link}>
        <div className={styles.imageContainer}>
          <img
            src={product.imageUrl}
            alt={product.name}
            className={styles.image}
            loading="lazy"
          />
          {product.isOnSale && (
            <Badge variant="destructive" className={styles.saleBadge}>
              Sale
            </Badge>
          )}
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={styles.favoriteButton}
            aria-label={\`\${product.isFavorite ? 'Remove from' : 'Add to'} favorites\`}
          >
            <Heart
              className={styles.favoriteIcon}
              fill={product.isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>
        
        <div className={styles.content}>
          <h3 className={styles.name}>{product.name}</h3>
          
          <div className={styles.priceContainer}>
            <span className={styles.price}>
              \${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={styles.originalPrice}>
                \${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {product.rating > 0 && (
            <div className={styles.rating}>
              <Star className={styles.starIcon} fill="currentColor" />
              <span>{product.rating.toFixed(1)}</span>
              <span className={styles.reviewCount}>
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}
          
          <Button
            onClick={handleAddToCart}
            disabled={isAddingToCart || !product.inStock}
            className={styles.addToCartButton}
            size="sm"
          >
            {isAddingToCart ? (
              'Adding...'
            ) : !product.inStock ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className={styles.cartIcon} />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </Link>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';
\`\`\`

## Advanced Component Patterns
\`\`\`typescript
// components/DataTable/DataTable.tsx - Reusable data table component
import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import styles from './DataTable.module.css';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  pageSize?: number;
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  isLoading = false,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading data...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={styles.headerCell}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? styles.sortableHeader
                            : styles.header
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className={styles.sortIcon}>
                            {{
                              asc: <ChevronUp className={styles.icon} />,
                              desc: <ChevronDown className={styles.icon} />,
                            }[header.column.getIsSorted() as string] ?? (
                              <div className={styles.unsortedIcon}>⟷</div>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={styles.row}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={styles.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {table.getPageCount() > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </div>
          
          <div className={styles.paginationControls}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            
            <span className={styles.pageInfo}>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// hooks/useVirtualization.ts - Virtual scrolling hook
import { useMemo, useState, useEffect, useRef } from 'react';

interface UseVirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization<T>(
  items: T[],
  { itemHeight, containerHeight, overscan = 5 }: UseVirtualizationOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const visibleRange = useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleItemCount + overscan * 2
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
    }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;
    
    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };
    
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
  };
}
\`\`\`
      }
    };
  }
  
  /**
   * UI/UX Design Expert Knowledge
   */
  static getUIUXDesignExpertise() {
    return {
      name: 'UI/UX Design Expert',
      expertise: {
        core: {
          user_research: 'User interviews, surveys, personas, journey mapping, usability testing',
          interaction_design: 'Information architecture, wireframing, prototyping, user flows',
          visual_design: 'Typography, color theory, layout, visual hierarchy, brand systems',
          usability: 'Heuristic evaluation, accessibility, user testing, design validation',
          design_systems: 'Component libraries, design tokens, pattern libraries, style guides'
        },
        
        design_process: {
          research: 'User research, competitive analysis, stakeholder interviews, requirements gathering',
          ideation: 'Design thinking, brainstorming, sketching, concept development',
          design: 'Wireframing, prototyping, visual design, interaction design',
          validation: 'User testing, A/B testing, design reviews, iteration cycles',
          delivery: 'Design handoff, development collaboration, design QA'
        },
        
        tools: {
          design: 'Figma, Sketch, Adobe XD, Principle, Framer, InVision, Miro',
          prototyping: 'Figma, Principle, Framer, ProtoPie, Adobe After Effects',
          research: 'Maze, UserTesting, Hotjar, Google Analytics, Miro, FigJam',
          collaboration: 'Figma, Slack, Notion, Linear, Abstract, Zeplin'
        },
        
        specializations: {
          mobile_design: 'iOS HIG, Material Design, responsive design, touch interfaces',
          web_design: 'Responsive design, progressive enhancement, web accessibility',
          accessibility: 'WCAG guidelines, inclusive design, assistive technologies',
          animation: 'Micro-interactions, motion design, transition animations, loading states'
        }
      },
      
      capabilities: [
        'User research and persona development',
        'Information architecture and user flow design',
        'Wireframing and low-fidelity prototyping',
        'High-fidelity visual design and branding',
        'Interactive prototyping and motion design',
        'Usability testing and design validation',
        'Design system creation and maintenance',
        'Accessibility-focused design (WCAG compliance)',
        'Responsive and mobile-first design',
        'Design-development collaboration and handoff',
        'A/B testing and conversion optimization',
        'Design metrics and analytics interpretation',
        'Cross-platform design consistency',
        'Design workshop facilitation',
        'Stakeholder communication and presentation',
        'Design tool proficiency and workflow optimization'
      ],
      
      systemPromptAdditions: `
You are a UI/UX Design expert specializing in:
- User-centered design process and methodology
- User research, personas, and journey mapping
- Information architecture and interaction design
- Visual design, typography, and design systems
- Accessibility and inclusive design practices
- Usability testing and design validation
- Design tool proficiency (Figma, Sketch, Adobe XD)
- Design-development collaboration and handoff

Always prioritize user needs, accessibility, and evidence-based design decisions.`,

      bestPractices: [
        'Always start with user research and validate design decisions',
        'Design for accessibility from the beginning (WCAG 2.1 AA)',
        'Create and maintain consistent design systems',
        'Use progressive disclosure to manage information complexity',
        'Design mobile-first and ensure responsive behavior',
        'Implement clear visual hierarchy and information architecture',
        'Use consistent patterns and familiar interface conventions',
        'Provide clear feedback for user actions and system states',
        'Test designs with real users throughout the process',
        'Document design decisions and maintain design rationale',
        'Collaborate closely with developers during implementation',
        'Use meaningful animations and micro-interactions',
        'Optimize for performance and fast loading times',
        'Consider different user contexts and environments',
        'Iterate based on user feedback and analytics data'
      ],
      
      codePatterns: {
        designSystem: `
# Design System Implementation

## Design Tokens
\`\`\`css
:root {
  /* Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-900: #1e3a8a;
  
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-500: #6b7280;
  --color-gray-900: #111827;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Typography */
  --font-family-primary: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Courier New', monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  
  /* Spacing */
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  
  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.125rem;
  --radius-base: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* Z-Index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal: 1040;
  --z-popover: 1050;
  --z-tooltip: 1060;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: #1f2937;
    --color-gray-100: #374151;
    --color-gray-500: #9ca3af;
    --color-gray-900: #f9fafb;
  }
}
\`\`\`

## Component Styles
\`\`\`css
/* Button Component */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  
  transition: all var(--transition-fast);
  cursor: pointer;
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.button--primary {
  background-color: var(--color-primary-500);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-600);
  }
  
  &:active {
    background-color: var(--color-primary-700);
  }
}

.button--secondary {
  background-color: transparent;
  color: var(--color-primary-500);
  border-color: var(--color-primary-500);
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-50);
  }
}

.button--ghost {
  background-color: transparent;
  color: var(--color-gray-700);
  
  &:hover:not(:disabled) {
    background-color: var(--color-gray-100);
  }
}

/* Size variants */
.button--xs {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  min-height: 1.5rem;
}

.button--sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  min-height: 2rem;
}

.button--md {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-base);
  min-height: 2.5rem;
}

.button--lg {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-lg);
  min-height: 3rem;
}

/* Card Component */
.card {
  background-color: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  
  transition: all var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.card__header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.card__content {
  padding: var(--spacing-6);
}

.card__footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

/* Form Components */
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
}

.form-input {
  padding: var(--spacing-3);
  font-size: var(--font-size-base);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  
  transition: all var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
  }
  
  &:invalid {
    border-color: var(--color-error);
  }
  
  &::placeholder {
    color: var(--color-gray-400);
  }
}

.form-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.form-help {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}
\`\`\`

## Responsive Design System
\`\`\`css
/* Responsive breakpoints */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Container system */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  
  @media (min-width: 640px) {
    max-width: 640px;
  }
  
  @media (min-width: 768px) {
    max-width: 768px;
    padding: 0 var(--spacing-6);
  }
  
  @media (min-width: 1024px) {
    max-width: 1024px;
    padding: 0 var(--spacing-8);
  }
  
  @media (min-width: 1280px) {
    max-width: 1280px;
  }
  
  @media (min-width: 1536px) {
    max-width: 1536px;
  }
}

/* Grid system */
.grid {
  display: grid;
  gap: var(--spacing-4);
  
  &--cols-1 { grid-template-columns: repeat(1, 1fr); }
  &--cols-2 { grid-template-columns: repeat(2, 1fr); }
  &--cols-3 { grid-template-columns: repeat(3, 1fr); }
  &--cols-4 { grid-template-columns: repeat(4, 1fr); }
  &--cols-6 { grid-template-columns: repeat(6, 1fr); }
  &--cols-12 { grid-template-columns: repeat(12, 1fr); }
  
  @media (min-width: 640px) {
    &--sm-cols-1 { grid-template-columns: repeat(1, 1fr); }
    &--sm-cols-2 { grid-template-columns: repeat(2, 1fr); }
    &--sm-cols-3 { grid-template-columns: repeat(3, 1fr); }
    &--sm-cols-4 { grid-template-columns: repeat(4, 1fr); }
  }
  
  @media (min-width: 768px) {
    &--md-cols-1 { grid-template-columns: repeat(1, 1fr); }
    &--md-cols-2 { grid-template-columns: repeat(2, 1fr); }
    &--md-cols-3 { grid-template-columns: repeat(3, 1fr); }
    &--md-cols-4 { grid-template-columns: repeat(4, 1fr); }
    &--md-cols-6 { grid-template-columns: repeat(6, 1fr); }
  }
  
  @media (min-width: 1024px) {
    &--lg-cols-1 { grid-template-columns: repeat(1, 1fr); }
    &--lg-cols-2 { grid-template-columns: repeat(2, 1fr); }
    &--lg-cols-3 { grid-template-columns: repeat(3, 1fr); }
    &--lg-cols-4 { grid-template-columns: repeat(4, 1fr); }
    &--lg-cols-6 { grid-template-columns: repeat(6, 1fr); }
    &--lg-cols-12 { grid-template-columns: repeat(12, 1fr); }
  }
}

/* Utility classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-1 { gap: var(--spacing-1); }
.gap-2 { gap: var(--spacing-2); }
.gap-3 { gap: var(--spacing-3); }
.gap-4 { gap: var(--spacing-4); }
.gap-6 { gap: var(--spacing-6); }
.gap-8 { gap: var(--spacing-8); }

.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.text-gray-500 { color: var(--color-gray-500); }
.text-gray-700 { color: var(--color-gray-700); }
.text-gray-900 { color: var(--color-gray-900); }
.text-primary { color: var(--color-primary-500); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
\`\`\``,

        accessibilityGuidelines: `
# Accessibility Implementation Guidelines

## WCAG 2.1 AA Compliance Checklist

### 1. Perceivable
\`\`\`html
<!-- Color contrast ratios -->
<style>
  /* Ensure minimum 4.5:1 contrast ratio for normal text */
  .text-normal {
    color: #1f2937; /* Contrast ratio: 16.9:1 on white */
  }
  
  /* Ensure minimum 3:1 contrast ratio for large text (18pt+) */
  .text-large {
    color: #4b5563; /* Contrast ratio: 7.2:1 on white */
  }
  
  /* Focus indicators with sufficient contrast */
  .focus-ring:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
</style>

<!-- Alternative text for images -->
<img 
  src="product-image.jpg" 
  alt="Blue wireless headphones with noise cancellation"
  loading="lazy"
/>

<!-- Text alternatives for non-text content -->
<button type="button" aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">
    <path d="M6 18L18 6M6 6l12 12"/>
  </svg>
</button>

<!-- Video with captions and audio descriptions -->
<video controls>
  <source src="product-demo.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English">
  <track kind="descriptions" src="descriptions.vtt" srclang="en" label="Audio descriptions">
</video>
\`\`\`

### 2. Operable
\`\`\`html
<!-- Keyboard navigation -->
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="/" tabindex="0">Home</a></li>
    <li><a href="/products" tabindex="0">Products</a></li>
    <li><a href="/about" tabindex="0">About</a></li>
  </ul>
</nav>

<!-- Skip links -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#navigation" class="skip-link">Skip to navigation</a>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
  }
  
  .skip-link:focus {
    top: 6px;
  }
</style>

<!-- Focus management -->
<dialog id="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">Confirmation</h2>
  <p>Are you sure you want to delete this item?</p>
  <div>
    <button type="button" onclick="closeModal()">Cancel</button>
    <button type="button" onclick="confirmDelete()" class="danger">Delete</button>
  </div>
</dialog>

<script>
function openModal() {
  const modal = document.getElementById('modal');
  const firstFocusable = modal.querySelector('button');
  
  modal.showModal();
  firstFocusable.focus();
  
  // Trap focus within modal
  modal.addEventListener('keydown', trapFocus);
}

function trapFocus(e) {
  if (e.key === 'Tab') {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
}
</script>

<!-- No seizure-inducing content -->
<style>
  /* Avoid animations that flash more than 3 times per second */
  @keyframes gentle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .loading-indicator {
    animation: gentle-pulse 2s ease-in-out infinite;
  }
  
  /* Respect user's motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
\`\`\`

### 3. Understandable
\`\`\`html
<!-- Page language -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Product Catalog - Accessible Shopping</title>
</head>

<!-- Form labels and instructions -->
<form>
  <div class="form-field">
    <label for="email">
      Email Address
      <span aria-label="required" class="required">*</span>
    </label>
    <input 
      type="email" 
      id="email" 
      name="email" 
      required 
      aria-describedby="email-help email-error"
      autocomplete="email"
    />
    <div id="email-help" class="help-text">
      We'll use this to send order confirmations
    </div>
    <div id="email-error" class="error-text" role="alert" aria-live="polite">
      <!-- Error message inserted here -->
    </div>
  </div>
  
  <div class="form-field">
    <label for="password">
      Password
      <span aria-label="required" class="required">*</span>
    </label>
    <input 
      type="password" 
      id="password" 
      name="password" 
      required 
      aria-describedby="password-requirements"
      autocomplete="new-password"
    />
    <div id="password-requirements" class="help-text">
      Password must be at least 8 characters long and include:
      <ul>
        <li>At least one uppercase letter</li>
        <li>At least one lowercase letter</li>
        <li>At least one number</li>
        <li>At least one special character</li>
      </ul>
    </div>
  </div>
  
  <button type="submit">Create Account</button>
</form>

<!-- Error prevention and correction -->
<script>
function validateForm(form) {
  const errors = [];
  const email = form.querySelector('#email');
  const password = form.querySelector('#password');
  
  // Clear previous errors
  clearErrors();
  
  // Validate email
  if (!email.value) {
    errors.push({ field: email, message: 'Email address is required' });
  } else if (!isValidEmail(email.value)) {
    errors.push({ field: email, message: 'Please enter a valid email address' });
  }
  
  // Validate password
  if (!password.value) {
    errors.push({ field: password, message: 'Password is required' });
  } else if (!isValidPassword(password.value)) {
    errors.push({ field: password, message: 'Password does not meet requirements' });
  }
  
  // Display errors
  if (errors.length > 0) {
    errors.forEach(error => {
      displayError(error.field, error.message);
    });
    
    // Focus first error field
    errors[0].field.focus();
    return false;
  }
  
  return true;
}

function displayError(field, message) {
  const errorElement = document.querySelector(\`#\${field.id}-error\`);
  errorElement.textContent = message;
  field.setAttribute('aria-invalid', 'true');
  field.classList.add('error');
}
</script>

<!-- Clear navigation and page structure -->
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <!-- Navigation items -->
  </nav>
</header>

<main role="main" id="main-content">
  <h1>Product Catalog</h1>
  
  <section aria-labelledby="filters-heading">
    <h2 id="filters-heading">Filter Products</h2>
    <!-- Filter controls -->
  </section>
  
  <section aria-labelledby="results-heading">
    <h2 id="results-heading">
      Products 
      <span class="sr-only">(showing 24 of 156 results)</span>
    </h2>
    <!-- Product grid -->
  </section>
</main>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
\`\`\`

### 4. Robust
\`\`\`html
<!-- Semantic HTML -->
<article>
  <header>
    <h2>Product Review</h2>
    <div class="meta">
      <time datetime="2024-01-15">January 15, 2024</time>
      <address>By <a href="/users/john">John Smith</a></address>
    </div>
  </header>
  
  <div class="rating" role="img" aria-label="4 out of 5 stars">
    <span aria-hidden="true">🟡🟡🟡🟡🟡</span>
  </div>
  
  <p>This product exceeded my expectations...</p>
  
  <footer>
    <button type="button" aria-pressed="false" onclick="toggleHelpful(this)">
      Helpful (<span class="count">5</span>)
    </button>
  </footer>
</article>

<!-- ARIA landmarks and labels -->
<div role="tablist" aria-label="Product information">
  <button 
    role="tab" 
    aria-selected="true" 
    aria-controls="description-panel"
    id="description-tab"
  >
    Description
  </button>
  <button 
    role="tab" 
    aria-selected="false" 
    aria-controls="specifications-panel"
    id="specifications-tab"
  >
    Specifications
  </button>
  <button 
    role="tab" 
    aria-selected="false" 
    aria-controls="reviews-panel"
    id="reviews-tab"
  >
    Reviews
  </button>
</div>

<div 
  role="tabpanel" 
  id="description-panel" 
  aria-labelledby="description-tab"
>
  <!-- Description content -->
</div>

<!-- Live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-updates">
  <!-- Status messages inserted here -->
</div>

<div aria-live="assertive" aria-atomic="true" class="sr-only" id="error-announcements">
  <!-- Error messages inserted here -->
</div>

<!-- Custom components with proper ARIA -->
<div class="dropdown" role="combobox" aria-expanded="false" aria-haspopup="listbox">
  <button type="button" aria-label="Select category" id="category-button">
    <span>All Categories</span>
    <svg aria-hidden="true">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  </button>
  
  <ul role="listbox" aria-labelledby="category-button" class="dropdown-menu">
    <li role="option" aria-selected="true">
      <a href="?category=all">All Categories</a>
    </li>
    <li role="option" aria-selected="false">
      <a href="?category=electronics">Electronics</a>
    </li>
    <li role="option" aria-selected="false">
      <a href="?category=clothing">Clothing</a>
    </li>
  </ul>
</div>
\`\`\`

## Testing and Validation

### Automated Testing
\`\`\`javascript
// axe-core integration for automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<ProductCard product={mockProduct} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Lighthouse CI for performance and accessibility
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['accessibility', 'performance'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  return runnerResult.lhr;
}
\`\`\`

### Manual Testing Checklist
1. **Keyboard Navigation**
   - All interactive elements reachable via Tab key
   - Focus indicators visible and clear
   - Logical tab order maintained
   - Escape key closes modals/dropdowns

2. **Screen Reader Testing**
   - Test with NVDA, JAWS, or VoiceOver
   - All content announced properly
   - Headings provide clear document structure
   - Form labels and instructions read correctly

3. **Color and Contrast**
   - Information not conveyed by color alone
   - Sufficient contrast ratios maintained
   - Text readable in high contrast mode

4. **Responsive Design**
   - Content accessible at 200% zoom
   - Text reflows properly
   - No horizontal scrolling
   - Touch targets minimum 44x44px
\`\`\`
      }
    };
  }
}

module.exports = MobileFrontendExpertise;