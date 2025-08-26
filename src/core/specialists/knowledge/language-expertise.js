/**
 * BUMBA Language Specialists Expertise
 * Sprint 24: Comprehensive language expertise for all programming language specialists
 * Covers: Python, JavaScript, Java, C++, C#, Go, Ruby, PHP, Swift, Kotlin, Rust, TypeScript, Elixir
 */

const languageExpertise = {
  getPythonExpertise() {
    return {
      core: {
        syntax: 'Python 3.12+ syntax, type hints, f-strings, pattern matching',
        paradigms: 'Object-oriented, functional, procedural, async/await patterns',
        stdlib: 'collections, itertools, asyncio, typing, dataclasses, pathlib',
        ecosystem: 'pip, venv, poetry, conda, pyenv, requirements management'
      },
      frameworks: {
        web: ['Django 5.0', 'FastAPI', 'Flask', 'Pyramid', 'Tornado'],
        data: ['NumPy', 'Pandas', 'Polars', 'Dask', 'Vaex'],
        ml: ['PyTorch', 'TensorFlow', 'scikit-learn', 'XGBoost', 'Transformers'],
        testing: ['pytest', 'unittest', 'hypothesis', 'tox', 'coverage'],
        async: ['asyncio', 'aiohttp', 'Celery', 'RQ', 'Dramatiq']
      },
      capabilities: [
        'Build production Django applications with REST APIs and GraphQL',
        'Create high-performance FastAPI services with async/await',
        'Develop data pipelines with Pandas and Apache Airflow',
        'Implement machine learning models with PyTorch and TensorFlow',
        'Build CLI tools with Click and Rich',
        'Create desktop apps with PyQt and Kivy',
        'Develop microservices with async frameworks',
        'Implement scientific computing with NumPy and SciPy',
        'Build web scrapers with BeautifulSoup and Scrapy',
        'Create automation scripts with subprocess and paramiko',
        'Develop RESTful APIs with Django REST Framework',
        'Implement real-time applications with WebSockets',
        'Build data visualization with Matplotlib and Plotly',
        'Create testing frameworks with pytest plugins',
        'Develop package distributions for PyPI',
        'Implement type-safe code with mypy and pydantic'
      ],
      bestPractices: [
        'Use type hints for all function signatures and variables',
        'Follow PEP 8 style guide with Black formatter',
        'Implement comprehensive error handling with custom exceptions',
        'Use virtual environments for dependency isolation',
        'Write docstrings for all modules, classes, and functions',
        'Implement logging instead of print statements',
        'Use context managers for resource management',
        'Apply SOLID principles and design patterns',
        'Write unit tests with pytest and aim for 90%+ coverage',
        'Use dataclasses or Pydantic for data validation',
        'Implement async/await for I/O-bound operations',
        'Use generators for memory-efficient iteration',
        'Apply functional programming with map, filter, reduce',
        'Implement proper exception hierarchy',
        'Use configuration files instead of hardcoded values'
      ],
      codePatterns: {
        asyncAPI: `
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI(title="Production API", version="1.0.0")

class ItemModel(BaseModel):
    id: Optional[int] = Field(None, description="Item ID")
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    tags: List[str] = Field(default_factory=list)

@app.post("/items", response_model=ItemModel, status_code=201)
async def create_item(
    item: ItemModel,
    db: AsyncSession = Depends(get_db)
) -> ItemModel:
    try:
        async with db.begin():
            result = await db.execute(
                insert(items).values(**item.dict(exclude={'id'}))
            )
            item.id = result.inserted_primary_key[0]
            return item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`,
        dataProcessing: `
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class DataProcessor:
    """Production data processing pipeline"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.validate_config()
    
    def process_dataset(
        self, 
        df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Process dataset with validation and error handling"""
        try:
            # Data validation
            self._validate_data(df)
            
            # Data cleaning
            df = self._clean_data(df)
            
            # Feature engineering
            df = self._engineer_features(df)
            
            # Generate metrics
            metrics = self._calculate_metrics(df)
            
            logger.info(f"Processed {len(df)} records successfully")
            return df, metrics
            
        except Exception as e:
            logger.error(f"Processing failed: {e}")
            raise
    
    def _validate_data(self, df: pd.DataFrame) -> None:
        """Validate input data"""
        required_columns = self.config.get('required_columns', [])
        missing = set(required_columns) - set(df.columns)
        if missing:
            raise ValueError(f"Missing columns: {missing}")`,
        testing: `
import pytest
from unittest.mock import Mock, patch, AsyncMock
from typing import Generator
import asyncio

@pytest.fixture
def mock_database() -> Generator[Mock, None, None]:
    """Fixture for mocked database"""
    with patch('app.database.get_connection') as mock:
        mock.return_value = AsyncMock()
        yield mock

@pytest.mark.asyncio
async def test_api_endpoint(mock_database):
    """Test async API endpoint"""
    # Arrange
    mock_database.fetch_one.return_value = {
        'id': 1, 
        'name': 'Test Item'
    }
    
    # Act
    response = await client.get('/items/1')
    
    # Assert
    assert response.status_code == 200
    assert response.json()['name'] == 'Test Item'
    mock_database.fetch_one.assert_called_once()

class TestDataProcessor:
    """Test suite for data processor"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.processor = DataProcessor(config={'threshold': 0.5})
    
    @pytest.mark.parametrize('input_val,expected', [
        (0, False),
        (0.5, True),
        (1.0, True)
    ])
    def test_threshold_logic(self, input_val, expected):
        result = self.processor.check_threshold(input_val)
        assert result == expected`
      }
    };
  },

  getJavaScriptExpertise() {
    return {
      core: {
        syntax: 'ES2024+ features, destructuring, spread/rest, optional chaining',
        paradigms: 'Functional, OOP, event-driven, reactive programming',
        runtime: 'V8 engine, event loop, memory management, Web APIs',
        ecosystem: 'npm, yarn, pnpm, webpack, vite, esbuild, babel'
      },
      frameworks: {
        frontend: ['React 18', 'Vue 3', 'Angular 17', 'Svelte', 'Solid'],
        backend: ['Node.js', 'Express', 'Fastify', 'NestJS', 'Koa'],
        fullstack: ['Next.js 14', 'Nuxt 3', 'Remix', 'SvelteKit', 'Astro'],
        mobile: ['React Native', 'Ionic', 'NativeScript', 'Expo'],
        testing: ['Jest', 'Vitest', 'Cypress', 'Playwright', 'Testing Library']
      },
      capabilities: [
        'Build scalable React applications with hooks and context',
        'Create Node.js microservices with Express and Fastify',
        'Develop real-time applications with Socket.io and WebSockets',
        'Implement server-side rendering with Next.js',
        'Build Progressive Web Apps with service workers',
        'Create GraphQL APIs with Apollo Server',
        'Develop Chrome extensions and Electron apps',
        'Implement state management with Redux and Zustand',
        'Build component libraries with Storybook',
        'Create build tools and CLI applications',
        'Develop serverless functions for AWS Lambda',
        'Implement WebAssembly modules',
        'Build reactive applications with RxJS',
        'Create automated testing suites with Jest and Cypress',
        'Develop npm packages and libraries',
        'Implement micro-frontends architecture'
      ],
      bestPractices: [
        'Use const/let instead of var for variable declarations',
        'Implement error boundaries and error handling',
        'Apply async/await over callbacks and promises',
        'Use TypeScript for type safety in large projects',
        'Implement proper module patterns and exports',
        'Follow Airbnb or Standard style guide',
        'Use ESLint and Prettier for code quality',
        'Implement unit and integration testing',
        'Apply SOLID principles and design patterns',
        'Use environment variables for configuration',
        'Implement proper logging and monitoring',
        'Optimize bundle size with code splitting',
        'Use semantic versioning for releases',
        'Implement CI/CD pipelines',
        'Apply security best practices (CSP, sanitization)'
      ],
      codePatterns: {
        modernReact: `
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';

const ItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  tags: z.array(z.string())
});

type Item = z.infer<typeof ItemSchema>;

export const ItemManager: React.FC = () => {
  const [filter, setFilter] = useState('');
  
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items', filter],
    queryFn: () => fetchItems(filter),
    staleTime: 5 * 60 * 1000,
  });
  
  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
  
  const filteredItems = useMemo(
    () => items?.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    ),
    [items, filter]
  );
  
  const handleSubmit = useCallback(async (data: Item) => {
    try {
      const validated = ItemSchema.parse(data);
      await mutation.mutateAsync(validated);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [mutation]);
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorBoundary error={error} />;
  
  return (
    <div>
      {filteredItems?.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};`,
        nodeAPI: `
import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const app = express();
const prisma = new PrismaClient();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Schema validation
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  description: z.string().optional()
});

// Error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
app.post('/api/items', limiter, asyncHandler(async (req, res) => {
  const validated = createItemSchema.parse(req.body);
  
  const item = await prisma.item.create({
    data: validated
  });
  
  logger.info('Item created', { itemId: item.id });
  res.status(201).json(item);
}));

// Error middleware
app.use((err, req, res, next) => {
  logger.error('Request failed', { error: err.message, stack: err.stack });
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({ errors: err.errors });
  }
  
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});`,
        asyncPatterns: `
// Modern async patterns and error handling
class DataService {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.queue = [];
  }
  
  async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}\`);
        }
        
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(Math.pow(2, i) * 1000);
      }
    }
  }
  
  async batchProcess(items, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(item => this.processItem(item))
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}`
      }
    };
  },

  getJavaExpertise() {
    return {
      core: {
        syntax: 'Java 21 LTS, records, sealed classes, pattern matching, virtual threads',
        paradigms: 'Object-oriented, functional streams, reactive programming',
        jvm: 'Memory management, garbage collection, JIT compilation, class loading',
        ecosystem: 'Maven, Gradle, Spring Boot, Jakarta EE, MicroProfile'
      },
      frameworks: {
        web: ['Spring Boot 3', 'Spring MVC', 'Jakarta EE', 'Micronaut', 'Quarkus'],
        reactive: ['Spring WebFlux', 'Project Reactor', 'RxJava', 'Vert.x'],
        persistence: ['Hibernate', 'Spring Data JPA', 'MyBatis', 'JOOQ'],
        microservices: ['Spring Cloud', 'Helidon', 'Open Liberty', 'Payara'],
        testing: ['JUnit 5', 'Mockito', 'TestContainers', 'RestAssured', 'Cucumber']
      },
      capabilities: [
        'Build enterprise Spring Boot applications',
        'Create microservices with Spring Cloud',
        'Implement reactive systems with WebFlux',
        'Develop RESTful APIs with JAX-RS',
        'Build event-driven systems with Kafka',
        'Create Android applications',
        'Implement JPA/Hibernate data layers',
        'Build GraphQL APIs with Spring GraphQL',
        'Develop CLI tools with Picocli',
        'Create desktop apps with JavaFX',
        'Implement messaging with JMS/RabbitMQ',
        'Build batch processing with Spring Batch',
        'Create serverless functions with Quarkus',
        'Implement security with Spring Security',
        'Develop gRPC services',
        'Build modular applications with JPMS'
      ],
      bestPractices: [
        'Use records for immutable data carriers',
        'Apply SOLID principles and design patterns',
        'Implement proper exception handling',
        'Use Optional to avoid null pointer exceptions',
        'Apply dependency injection with Spring/CDI',
        'Write comprehensive unit and integration tests',
        'Use Lombok to reduce boilerplate code',
        'Implement logging with SLF4J',
        'Apply defensive programming techniques',
        'Use try-with-resources for resource management',
        'Implement proper equals, hashCode, and toString',
        'Use Stream API for functional programming',
        'Apply proper package structure',
        'Implement validation with Bean Validation',
        'Use CompletableFuture for async operations'
      ],
      codePatterns: {
        springBootService: `
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Validated
@Slf4j
public class ProductController {
    
    private final ProductService productService;
    private final ProductMapper mapper;
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ProductDto> createProduct(
            @Valid @RequestBody CreateProductRequest request) {
        
        log.info("Creating product: {}", request.getName());
        
        Product product = productService.create(
            mapper.toEntity(request)
        );
        
        return ResponseEntity
            .created(URI.create("/api/v1/products/" + product.getId()))
            .body(mapper.toDto(product));
    }
    
    @GetMapping("/{id}")
    @Cacheable("products")
    public ProductDto getProduct(@PathVariable UUID id) {
        return productService.findById(id)
            .map(mapper::toDto)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Product not found: " + id
            ));
    }
    
    @GetMapping
    public Page<ProductDto> listProducts(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String search) {
        
        Specification<Product> spec = ProductSpecifications
            .withSearch(search);
            
        return productService.findAll(spec, pageable)
            .map(mapper::toDto);
    }
}

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    
    private final ProductRepository repository;
    private final EventPublisher eventPublisher;
    private final ProductValidator validator;
    
    public Product create(Product product) {
        validator.validateForCreation(product);
        
        Product saved = repository.save(product);
        
        eventPublisher.publish(new ProductCreatedEvent(saved));
        
        return saved;
    }
    
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public Optional<Product> findById(UUID id) {
        return repository.findById(id);
    }
}`,
        reactiveService: `
@Component
@RequiredArgsConstructor
public class ReactiveOrderService {
    
    private final ReactiveMongoTemplate mongoTemplate;
    private final WebClient webClient;
    private final Sinks.Many<OrderEvent> eventSink;
    
    public Mono<Order> processOrder(CreateOrderRequest request) {
        return Mono.just(request)
            .map(this::validateRequest)
            .flatMap(this::checkInventory)
            .flatMap(this::createOrder)
            .flatMap(this::processPayment)
            .doOnNext(this::publishEvent)
            .doOnError(error -> log.error("Order processing failed", error))
            .onErrorMap(this::mapException)
            .subscribeOn(Schedulers.boundedElastic());
    }
    
    private Mono<Order> checkInventory(CreateOrderRequest request) {
        return Flux.fromIterable(request.getItems())
            .flatMap(item -> 
                webClient.get()
                    .uri("/inventory/{id}", item.getProductId())
                    .retrieve()
                    .bodyToMono(InventoryStatus.class)
                    .timeout(Duration.ofSeconds(5))
                    .retry(3)
            )
            .collectList()
            .map(statuses -> validateInventory(request, statuses));
    }
    
    private Mono<Order> createOrder(CreateOrderRequest request) {
        Order order = Order.builder()
            .id(UUID.randomUUID())
            .customerId(request.getCustomerId())
            .items(request.getItems())
            .status(OrderStatus.PENDING)
            .createdAt(Instant.now())
            .build();
            
        return mongoTemplate.save(order);
    }
}`,
        testingPatterns: `
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class ProductControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private ProductService productService;
    
    @Test
    @DisplayName("Should create product successfully")
    void createProduct_Success() throws Exception {
        // Given
        CreateProductRequest request = CreateProductRequest.builder()
            .name("Test Product")
            .price(BigDecimal.valueOf(99.99))
            .build();
            
        Product product = Product.builder()
            .id(UUID.randomUUID())
            .name(request.getName())
            .price(request.getPrice())
            .build();
            
        when(productService.create(any())).thenReturn(product);
        
        // When & Then
        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(product.getId().toString()))
            .andExpect(jsonPath("$.name").value(product.getName()));
            
        verify(productService).create(argumentCaptor.capture());
        assertThat(argumentCaptor.getValue().getName())
            .isEqualTo(request.getName());
    }
}

@TestContainers
@DataJpaTest
class ProductRepositoryTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");
    
    @Autowired
    private ProductRepository repository;
    
    @Test
    void findByNameContaining_ShouldReturnMatchingProducts() {
        // Given
        repository.saveAll(List.of(
            new Product("Apple iPhone"),
            new Product("Samsung Galaxy"),
            new Product("Apple iPad")
        ));
        
        // When
        List<Product> products = repository.findByNameContaining("Apple");
        
        // Then
        assertThat(products).hasSize(2)
            .extracting(Product::getName)
            .containsExactlyInAnyOrder("Apple iPhone", "Apple iPad");
    }
}`
      }
    };
  },

  getCppExpertise() {
    return {
      core: {
        syntax: 'C++23 standard, concepts, ranges, coroutines, modules',
        paradigms: 'Object-oriented, generic programming, functional, metaprogramming',
        memory: 'RAII, smart pointers, move semantics, memory ordering',
        ecosystem: 'CMake, Conan, vcpkg, Bazel, Make'
      },
      frameworks: {
        general: ['Boost', 'Qt6', 'POCO', 'Abseil', 'Folly'],
        gaming: ['Unreal Engine', 'Godot', 'SFML', 'SDL2', 'Raylib'],
        networking: ['ASIO', 'gRPC', 'ZeroMQ', 'libcurl', 'cpp-httplib'],
        testing: ['Google Test', 'Catch2', 'doctest', 'Boost.Test'],
        gui: ['Qt', 'GTKmm', 'Dear ImGui', 'wxWidgets', 'FLTK']
      },
      capabilities: [
        'Develop high-performance system software',
        'Create game engines and graphics applications',
        'Build embedded systems and IoT devices',
        'Implement operating system components',
        'Develop real-time trading systems',
        'Create cross-platform desktop applications',
        'Build network servers and protocols',
        'Implement computer vision algorithms',
        'Develop audio/video processing software',
        'Create compilers and interpreters',
        'Build scientific computing applications',
        'Implement cryptographic systems',
        'Develop database engines',
        'Create device drivers',
        'Build robotics control systems',
        'Implement machine learning frameworks'
      ],
      bestPractices: [
        'Use RAII for resource management',
        'Prefer smart pointers over raw pointers',
        'Apply const correctness throughout',
        'Use move semantics for performance',
        'Implement rule of five/zero',
        'Prefer algorithms over hand-written loops',
        'Use concepts for template constraints',
        'Apply SOLID principles',
        'Minimize use of macros',
        'Use namespace appropriately',
        'Implement exception safety guarantees',
        'Prefer stack allocation over heap',
        'Use modern C++ features (C++17/20/23)',
        'Apply static analysis tools',
        'Profile before optimizing'
      ],
      codePatterns: {
        modernCpp: `
#include <memory>
#include <vector>
#include <algorithm>
#include <ranges>
#include <concepts>
#include <coroutine>
#include <format>

template<typename T>
concept Drawable = requires(T t) {
    { t.draw() } -> std::same_as<void>;
    { t.getBounds() } -> std::convertible_to<Rectangle>;
};

template<Drawable T>
class RenderEngine {
private:
    std::vector<std::unique_ptr<T>> objects;
    mutable std::shared_mutex mutex_;
    
public:
    void addObject(std::unique_ptr<T> obj) {
        std::unique_lock lock(mutex_);
        objects.push_back(std::move(obj));
    }
    
    void render() const {
        std::shared_lock lock(mutex_);
        
        auto visible = objects 
            | std::views::filter([](const auto& obj) {
                return obj->isVisible();
              })
            | std::views::take(100);
        
        std::ranges::for_each(visible, [](const auto& obj) {
            obj->draw();
        });
    }
    
    [[nodiscard]] auto findCollisions() const -> std::vector<CollisionPair> {
        std::vector<CollisionPair> collisions;
        
        for (auto it = objects.begin(); it != objects.end(); ++it) {
            for (auto jt = std::next(it); jt != objects.end(); ++jt) {
                if (checkCollision(**it, **jt)) {
                    collisions.emplace_back(*it, *jt);
                }
            }
        }
        
        return collisions;
    }
};`,
        asyncNetworking: `
#include <asio.hpp>
#include <asio/awaitable.hpp>
#include <asio/co_spawn.hpp>
#include <memory>
#include <string>

class AsyncTcpServer {
private:
    asio::io_context& io_context_;
    asio::ip::tcp::acceptor acceptor_;
    
public:
    AsyncTcpServer(asio::io_context& io_context, uint16_t port)
        : io_context_(io_context)
        , acceptor_(io_context, asio::ip::tcp::endpoint(
            asio::ip::tcp::v4(), port)) {}
    
    asio::awaitable<void> listen() {
        while (true) {
            auto [error, socket] = co_await acceptor_.async_accept(
                asio::as_tuple(asio::use_awaitable)
            );
            
            if (!error) {
                asio::co_spawn(io_context_,
                    handleClient(std::move(socket)),
                    asio::detached
                );
            }
        }
    }
    
private:
    asio::awaitable<void> handleClient(asio::ip::tcp::socket socket) {
        try {
            std::array<char, 1024> buffer;
            
            while (socket.is_open()) {
                auto [error, n] = co_await socket.async_read_some(
                    asio::buffer(buffer),
                    asio::as_tuple(asio::use_awaitable)
                );
                
                if (error == asio::error::eof) {
                    break;
                }
                
                if (!error) {
                    co_await async_write(socket,
                        asio::buffer(buffer.data(), n),
                        asio::use_awaitable
                    );
                }
            }
        } catch (const std::exception& e) {
            std::cerr << "Client error: " << e.what() << '\\n';
        }
    }
};`,
        performanceOptimized: `
#include <immintrin.h>
#include <execution>
#include <atomic>
#include <thread>

template<typename T>
class LockFreeQueue {
private:
    struct Node {
        std::atomic<T*> data;
        std::atomic<Node*> next;
        
        Node() : data(nullptr), next(nullptr) {}
    };
    
    alignas(64) std::atomic<Node*> head_;
    alignas(64) std::atomic<Node*> tail_;
    
public:
    LockFreeQueue() {
        Node* dummy = new Node;
        head_.store(dummy);
        tail_.store(dummy);
    }
    
    void enqueue(T item) {
        Node* newNode = new Node;
        T* data = new T(std::move(item));
        newNode->data.store(data);
        
        Node* prevTail = tail_.exchange(newNode);
        prevTail->next.store(newNode);
    }
    
    std::optional<T> dequeue() {
        Node* head = head_.load();
        Node* next = head->next.load();
        
        if (next == nullptr) {
            return std::nullopt;
        }
        
        T* data = next->data.exchange(nullptr);
        head_.store(next);
        delete head;
        
        if (data) {
            T item = std::move(*data);
            delete data;
            return item;
        }
        
        return std::nullopt;
    }
};

// SIMD optimized matrix multiplication
void matmul_avx2(const float* a, const float* b, float* c,
                 size_t n, size_t m, size_t k) {
    #pragma omp parallel for collapse(2)
    for (size_t i = 0; i < n; ++i) {
        for (size_t j = 0; j < m; j += 8) {
            __m256 sum = _mm256_setzero_ps();
            
            for (size_t l = 0; l < k; ++l) {
                __m256 a_vec = _mm256_broadcast_ss(&a[i * k + l]);
                __m256 b_vec = _mm256_loadu_ps(&b[l * m + j]);
                sum = _mm256_fmadd_ps(a_vec, b_vec, sum);
            }
            
            _mm256_storeu_ps(&c[i * m + j], sum);
        }
    }
}`
      }
    };
  },

  getCSharpExpertise() {
    return {
      core: {
        syntax: 'C# 12, nullable reference types, pattern matching, records',
        paradigms: 'Object-oriented, functional, async/await, LINQ',
        runtime: '.NET 8, CLR, garbage collection, JIT compilation',
        ecosystem: 'NuGet, MSBuild, dotnet CLI, Visual Studio'
      },
      frameworks: {
        web: ['ASP.NET Core', 'Blazor', 'SignalR', 'Minimal APIs', 'gRPC'],
        desktop: ['WPF', 'WinForms', 'MAUI', 'Avalonia', 'UWP'],
        game: ['Unity', 'Godot', 'MonoGame', 'Stride', 'FNA'],
        cloud: ['Azure Functions', 'Azure Service Bus', 'Dapr', 'Orleans'],
        testing: ['xUnit', 'NUnit', 'MSTest', 'FluentAssertions', 'Moq']
      },
      capabilities: [
        'Build enterprise web applications with ASP.NET Core',
        'Create Blazor WebAssembly and Server applications',
        'Develop desktop applications with WPF and MAUI',
        'Build microservices with .NET and Docker',
        'Create Unity games and simulations',
        'Implement Azure cloud solutions',
        'Develop REST and GraphQL APIs',
        'Build real-time apps with SignalR',
        'Create serverless functions',
        'Implement Entity Framework data access',
        'Build Xamarin mobile applications',
        'Develop Windows services',
        'Create CLI tools and utilities',
        'Implement gRPC services',
        'Build ML.NET machine learning models',
        'Develop Office add-ins'
      ],
      bestPractices: [
        'Use nullable reference types for null safety',
        'Apply SOLID principles and dependency injection',
        'Implement async/await properly without blocking',
        'Use records for immutable data',
        'Apply pattern matching for cleaner code',
        'Use LINQ for data manipulation',
        'Implement proper exception handling',
        'Use IDisposable and using statements',
        'Apply repository and unit of work patterns',
        'Use configuration and options pattern',
        'Implement logging with ILogger',
        'Apply proper naming conventions',
        'Use value tuples for multiple returns',
        'Implement cancellation tokens',
        'Use source generators for performance'
      ],
      codePatterns: {
        minimalApi: `
using Microsoft.AspNetCore.RateLimiting;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", config =>
    {
        config.PermitLimit = 100;
        config.Window = TimeSpan.FromMinutes(1);
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseRateLimiter();

var api = app.MapGroup("/api/v1")
    .RequireRateLimiting("api")
    .WithOpenApi();

api.MapPost("/products", async (
    CreateProductRequest request,
    IValidator<CreateProductRequest> validator,
    IProductService service,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());
    
    var product = await service.CreateAsync(request, ct);
    return Results.Created($"/api/v1/products/{product.Id}", product);
})
.WithName("CreateProduct")
.Produces<ProductDto>(StatusCodes.Status201Created)
.Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest);

api.MapGet("/products", async (
    [AsParameters] ProductQuery query,
    IProductService service,
    CancellationToken ct) =>
{
    var products = await service.GetPagedAsync(query, ct);
    return Results.Ok(products);
})
.WithName("GetProducts")
.Produces<PagedResult<ProductDto>>();

app.Run();`,
        blazorComponent: `
@page "/products"
@using Microsoft.AspNetCore.Components.QuickGrid
@implements IAsyncDisposable
@inject IProductService ProductService
@inject IDialogService DialogService
@inject ISnackbar Snackbar

<PageTitle>Products</PageTitle>

<MudContainer MaxWidth="MaxWidth.Large">
    <MudCard>
        <MudCardContent>
            <MudGrid>
                <MudItem xs="12" md="6">
                    <MudTextField @bind-Value="searchText"
                                  Label="Search"
                                  Variant="Variant.Outlined"
                                  Adornment="Adornment.Start"
                                  AdornmentIcon="@Icons.Material.Filled.Search"
                                  DebounceInterval="500"
                                  OnDebounceIntervalElapsed="OnSearchChanged" />
                </MudItem>
                <MudItem xs="12" md="6" Class="d-flex justify-end">
                    <MudButton Variant="Variant.Filled"
                               Color="Color.Primary"
                               StartIcon="@Icons.Material.Filled.Add"
                               OnClick="OpenCreateDialog">
                        New Product
                    </MudButton>
                </MudItem>
            </MudGrid>
            
            <MudTable Items="@products"
                      Hover="true"
                      Loading="@isLoading"
                      LoadingProgressColor="Color.Info">
                <HeaderContent>
                    <MudTh>Name</MudTh>
                    <MudTh>Price</MudTh>
                    <MudTh>Stock</MudTh>
                    <MudTh>Actions</MudTh>
                </HeaderContent>
                <RowTemplate>
                    <MudTd DataLabel="Name">@context.Name</MudTd>
                    <MudTd DataLabel="Price">@context.Price.ToString("C")</MudTd>
                    <MudTd DataLabel="Stock">
                        <MudChip Color="@GetStockColor(context.Stock)">
                            @context.Stock
                        </MudChip>
                    </MudTd>
                    <MudTd>
                        <MudIconButton Icon="@Icons.Material.Filled.Edit"
                                       Color="Color.Primary"
                                       OnClick="() => EditProduct(context)" />
                        <MudIconButton Icon="@Icons.Material.Filled.Delete"
                                       Color="Color.Error"
                                       OnClick="() => DeleteProduct(context)" />
                    </MudTd>
                </RowTemplate>
            </MudTable>
        </MudCardContent>
    </MudCard>
</MudContainer>

@code {
    private List<ProductDto> products = new();
    private string searchText = string.Empty;
    private bool isLoading = false;
    private CancellationTokenSource cts = new();
    
    protected override async Task OnInitializedAsync()
    {
        await LoadProducts();
    }
    
    private async Task LoadProducts()
    {
        isLoading = true;
        try
        {
            products = await ProductService.GetProductsAsync(searchText, cts.Token);
        }
        catch (Exception ex)
        {
            Snackbar.Add($"Error loading products: {ex.Message}", Severity.Error);
        }
        finally
        {
            isLoading = false;
        }
    }
    
    private async Task OpenCreateDialog()
    {
        var dialog = await DialogService.ShowAsync<CreateProductDialog>("Create Product");
        var result = await dialog.Result;
        
        if (!result.Canceled)
        {
            await LoadProducts();
            Snackbar.Add("Product created successfully", Severity.Success);
        }
    }
    
    private Color GetStockColor(int stock) => stock switch
    {
        > 50 => Color.Success,
        > 10 => Color.Warning,
        _ => Color.Error
    };
    
    public async ValueTask DisposeAsync()
    {
        cts?.Cancel();
        cts?.Dispose();
    }
}`,
        efCoreRepository: `
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
    IQueryable<T> Query();
}

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;
    
    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }
    
    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(e => e.Id == id, ct);
    }
    
    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
    {
        return await _dbSet
            .AsNoTracking()
            .ToListAsync(ct);
    }
    
    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _dbSet.AddAsync(entity, ct);
        await _context.SaveChangesAsync(ct);
        return entity;
    }
    
    public virtual async Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync(ct);
    }
    
    public virtual async Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync(ct);
    }
    
    public virtual IQueryable<T> Query()
    {
        return _dbSet.AsQueryable();
    }
}

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context) { }
    
    public async Task<PagedResult<Product>> GetPagedAsync(
        ProductQuery query,
        CancellationToken ct = default)
    {
        var queryable = _dbSet.AsQueryable();
        
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            queryable = queryable.Where(p => 
                p.Name.Contains(query.Search) ||
                p.Description.Contains(query.Search));
        }
        
        if (query.MinPrice.HasValue)
        {
            queryable = queryable.Where(p => p.Price >= query.MinPrice.Value);
        }
        
        var totalCount = await queryable.CountAsync(ct);
        
        var items = await queryable
            .OrderBy(p => p.Name)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(p => p.Category)
            .ToListAsync(ct);
        
        return new PagedResult<Product>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }
}`
      }
    };
  },

  getGoExpertise() {
    return {
      core: {
        syntax: 'Go 1.21+, generics, type parameters, type inference',
        paradigms: 'Concurrent programming, channels, goroutines, interfaces',
        runtime: 'Garbage collection, scheduler, memory model, race detector',
        ecosystem: 'go modules, go tools, testing framework, benchmarking'
      },
      frameworks: {
        web: ['Gin', 'Echo', 'Fiber', 'Chi', 'Gorilla'],
        microservices: ['go-kit', 'go-micro', 'gRPC-go', 'Kratos'],
        database: ['GORM', 'sqlx', 'ent', 'bun', 'pgx'],
        testing: ['testify', 'gomock', 'ginkgo', 'goconvey'],
        cli: ['cobra', 'urfave/cli', 'kingpin', 'flag']
      },
      capabilities: [
        'Build high-performance web servers',
        'Create microservices and APIs',
        'Develop CLI tools and utilities',
        'Build distributed systems',
        'Implement gRPC services',
        'Create Docker containers and Kubernetes operators',
        'Develop network services and protocols',
        'Build concurrent data processing pipelines',
        'Implement WebSocket servers',
        'Create blockchain applications',
        'Develop system monitoring tools',
        'Build message queue consumers',
        'Implement caching layers',
        'Create load balancers and proxies',
        'Develop database drivers',
        'Build DevOps tools'
      ],
      bestPractices: [
        'Handle errors explicitly, not with exceptions',
        'Use channels for goroutine communication',
        'Apply context for cancellation and deadlines',
        'Keep interfaces small and focused',
        'Use defer for cleanup operations',
        'Implement table-driven tests',
        'Apply the Single Responsibility Principle',
        'Use sync package primitives correctly',
        'Avoid goroutine leaks',
        'Profile and benchmark critical paths',
        'Use go fmt and go vet',
        'Implement graceful shutdown',
        'Apply dependency injection',
        'Use structured logging',
        'Handle panics appropriately'
      ],
      codePatterns: {
        httpServer: `
package main

import (
    "context"
    "encoding/json"
    "errors"
    "net/http"
    "time"
    
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/google/uuid"
    "go.uber.org/zap"
)

type Server struct {
    router  *chi.Mux
    logger  *zap.Logger
    service *ProductService
}

func NewServer(logger *zap.Logger, service *ProductService) *Server {
    s := &Server{
        router:  chi.NewRouter(),
        logger:  logger,
        service: service,
    }
    
    s.setupMiddleware()
    s.setupRoutes()
    
    return s
}

func (s *Server) setupMiddleware() {
    s.router.Use(middleware.RequestID)
    s.router.Use(middleware.RealIP)
    s.router.Use(middleware.Logger)
    s.router.Use(middleware.Recoverer)
    s.router.Use(middleware.Timeout(60 * time.Second))
    s.router.Use(s.rateLimiter())
}

func (s *Server) setupRoutes() {
    s.router.Route("/api/v1", func(r chi.Router) {
        r.Route("/products", func(r chi.Router) {
            r.Get("/", s.handleListProducts)
            r.Post("/", s.handleCreateProduct)
            r.Route("/{id}", func(r chi.Router) {
                r.Use(s.productCtx)
                r.Get("/", s.handleGetProduct)
                r.Put("/", s.handleUpdateProduct)
                r.Delete("/", s.handleDeleteProduct)
            })
        })
    })
}

func (s *Server) handleCreateProduct(w http.ResponseWriter, r *http.Request) {
    var req CreateProductRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        s.respondError(w, http.StatusBadRequest, "Invalid request body")
        return
    }
    
    if err := req.Validate(); err != nil {
        s.respondError(w, http.StatusBadRequest, err.Error())
        return
    }
    
    product, err := s.service.CreateProduct(r.Context(), req)
    if err != nil {
        s.logger.Error("Failed to create product", zap.Error(err))
        s.respondError(w, http.StatusInternalServerError, "Internal server error")
        return
    }
    
    s.respondJSON(w, http.StatusCreated, product)
}

func (s *Server) productCtx(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        productID := chi.URLParam(r, "id")
        
        id, err := uuid.Parse(productID)
        if err != nil {
            s.respondError(w, http.StatusBadRequest, "Invalid product ID")
            return
        }
        
        product, err := s.service.GetProduct(r.Context(), id)
        if err != nil {
            if errors.Is(err, ErrNotFound) {
                s.respondError(w, http.StatusNotFound, "Product not found")
                return
            }
            s.respondError(w, http.StatusInternalServerError, "Internal server error")
            return
        }
        
        ctx := context.WithValue(r.Context(), "product", product)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}`,
        concurrentWorker: `
package worker

import (
    "context"
    "sync"
    "time"
)

type Job struct {
    ID   string
    Data interface{}
}

type Result struct {
    JobID string
    Data  interface{}
    Error error
}

type WorkerPool struct {
    workers    int
    jobQueue   chan Job
    results    chan Result
    wg         sync.WaitGroup
    ctx        context.Context
    cancel     context.CancelFunc
}

func NewWorkerPool(workers int, queueSize int) *WorkerPool {
    ctx, cancel := context.WithCancel(context.Background())
    
    return &WorkerPool{
        workers:  workers,
        jobQueue: make(chan Job, queueSize),
        results:  make(chan Result, queueSize),
        ctx:      ctx,
        cancel:   cancel,
    }
}

func (p *WorkerPool) Start(processor func(Job) Result) {
    for i := 0; i < p.workers; i++ {
        p.wg.Add(1)
        go p.worker(processor)
    }
}

func (p *WorkerPool) worker(processor func(Job) Result) {
    defer p.wg.Done()
    
    for {
        select {
        case <-p.ctx.Done():
            return
        case job, ok := <-p.jobQueue:
            if !ok {
                return
            }
            
            result := p.processWithTimeout(job, processor)
            
            select {
            case p.results <- result:
            case <-p.ctx.Done():
                return
            }
        }
    }
}

func (p *WorkerPool) processWithTimeout(job Job, processor func(Job) Result) Result {
    ctx, cancel := context.WithTimeout(p.ctx, 30*time.Second)
    defer cancel()
    
    done := make(chan Result, 1)
    
    go func() {
        done <- processor(job)
    }()
    
    select {
    case result := <-done:
        return result
    case <-ctx.Done():
        return Result{
            JobID: job.ID,
            Error: ctx.Err(),
        }
    }
}

func (p *WorkerPool) Submit(job Job) error {
    select {
    case p.jobQueue <- job:
        return nil
    case <-p.ctx.Done():
        return p.ctx.Err()
    default:
        return ErrQueueFull
    }
}

func (p *WorkerPool) Results() <-chan Result {
    return p.results
}

func (p *WorkerPool) Shutdown() {
    p.cancel()
    close(p.jobQueue)
    p.wg.Wait()
    close(p.results)
}`,
        databaseLayer: `
package repository

import (
    "context"
    "database/sql"
    "fmt"
    
    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

type ProductRepository struct {
    db *sqlx.DB
}

func NewProductRepository(db *sqlx.DB) *ProductRepository {
    return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(ctx context.Context, product *Product) error {
    query := \`
        INSERT INTO products (id, name, description, price, stock, created_at, updated_at)
        VALUES (:id, :name, :description, :price, :stock, :created_at, :updated_at)\`
    
    _, err := r.db.NamedExecContext(ctx, query, product)
    return err
}

func (r *ProductRepository) GetByID(ctx context.Context, id string) (*Product, error) {
    var product Product
    
    query := \`
        SELECT id, name, description, price, stock, created_at, updated_at
        FROM products
        WHERE id = $1 AND deleted_at IS NULL\`
    
    err := r.db.GetContext(ctx, &product, query, id)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, ErrNotFound
        }
        return nil, fmt.Errorf("get product: %w", err)
    }
    
    return &product, nil
}

func (r *ProductRepository) List(ctx context.Context, filter ListFilter) ([]*Product, error) {
    query := \`
        SELECT id, name, description, price, stock, created_at, updated_at
        FROM products
        WHERE deleted_at IS NULL\`
    
    args := []interface{}{}
    argCount := 0
    
    if filter.Search != "" {
        argCount++
        query += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", 
            argCount, argCount)
        args = append(args, "%"+filter.Search+"%")
    }
    
    if filter.MinPrice > 0 {
        argCount++
        query += fmt.Sprintf(" AND price >= $%d", argCount)
        args = append(args, filter.MinPrice)
    }
    
    query += " ORDER BY created_at DESC"
    
    if filter.Limit > 0 {
        query += fmt.Sprintf(" LIMIT %d OFFSET %d", filter.Limit, filter.Offset)
    }
    
    var products []*Product
    err := r.db.SelectContext(ctx, &products, query, args...)
    
    return products, err
}

func (r *ProductRepository) Update(ctx context.Context, product *Product) error {
    query := \`
        UPDATE products
        SET name = :name,
            description = :description,
            price = :price,
            stock = :stock,
            updated_at = :updated_at
        WHERE id = :id AND deleted_at IS NULL\`
    
    result, err := r.db.NamedExecContext(ctx, query, product)
    if err != nil {
        return fmt.Errorf("update product: %w", err)
    }
    
    rows, err := result.RowsAffected()
    if err != nil {
        return fmt.Errorf("rows affected: %w", err)
    }
    
    if rows == 0 {
        return ErrNotFound
    }
    
    return nil
}`
      }
    };
  },

  getRubyExpertise() {
    return {
      core: {
        syntax: 'Ruby 3.3, pattern matching, endless methods, RBS type signatures',
        paradigms: 'Object-oriented, functional, metaprogramming, DSLs',
        runtime: 'MRI, JRuby, TruffleRuby, YJIT compiler',
        ecosystem: 'RubyGems, Bundler, rbenv, RVM'
      },
      frameworks: {
        web: ['Rails 7', 'Sinatra', 'Hanami', 'Roda', 'Grape'],
        testing: ['RSpec', 'Minitest', 'Capybara', 'FactoryBot', 'VCR'],
        background: ['Sidekiq', 'Resque', 'DelayedJob', 'GoodJob'],
        api: ['Grape', 'Rails API', 'JSON:API', 'GraphQL-Ruby'],
        tools: ['Rake', 'Thor', 'Pry', 'RuboCop', 'Sorbet']
      },
      capabilities: [
        'Build Rails web applications',
        'Create REST and GraphQL APIs',
        'Develop microservices with Sinatra',
        'Build background job processing systems',
        'Create DSLs and metaprogramming',
        'Develop Ruby gems and libraries',
        'Build CLI tools and scripts',
        'Implement WebSocket with ActionCable',
        'Create test automation frameworks',
        'Build e-commerce platforms',
        'Develop content management systems',
        'Create DevOps automation scripts',
        'Build data processing pipelines',
        'Implement authentication systems',
        'Develop real-time applications',
        'Create API integrations'
      ],
      bestPractices: [
        'Follow Ruby style guide and use RuboCop',
        'Write comprehensive tests with RSpec/Minitest',
        'Use semantic versioning for gems',
        'Apply SOLID principles',
        'Use duck typing appropriately',
        'Implement proper error handling',
        'Use modules for mixins and namespacing',
        'Apply convention over configuration',
        'Use ActiveRecord callbacks sparingly',
        'Implement service objects for business logic',
        'Use concerns for shared behavior',
        'Apply database indexes properly',
        'Use background jobs for long operations',
        'Implement proper caching strategies',
        'Follow RESTful conventions'
      ],
      codePatterns: {
        railsController: `
class Api::V1::ProductsController < Api::V1::BaseController
  before_action :authenticate_user!
  before_action :set_product, only: [:show, :update, :destroy]
  
  def index
    @products = Product.includes(:category, :reviews)
                      .search(params[:q])
                      .filter_by(filter_params)
                      .page(params[:page])
                      .per(params[:per_page] || 25)
    
    render json: ProductSerializer.new(@products, {
      include: [:category],
      meta: pagination_meta(@products)
    }).serializable_hash
  end
  
  def show
    render json: ProductSerializer.new(@product, {
      include: [:category, :reviews]
    }).serializable_hash
  end
  
  def create
    @product = Product.new(product_params)
    
    if @product.save
      ProductIndexerJob.perform_later(@product.id)
      
      render json: ProductSerializer.new(@product).serializable_hash,
             status: :created
    else
      render json: { errors: @product.errors.full_messages },
             status: :unprocessable_entity
    end
  end
  
  def update
    if @product.update(product_params)
      render json: ProductSerializer.new(@product).serializable_hash
    else
      render json: { errors: @product.errors.full_messages },
             status: :unprocessable_entity
    end
  end
  
  def destroy
    @product.soft_delete!
    head :no_content
  end
  
  private
  
  def set_product
    @product = Product.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Product not found' }, status: :not_found
  end
  
  def product_params
    params.require(:product).permit(:name, :description, :price, :stock, 
                                   :category_id, tag_ids: [])
  end
  
  def filter_params
    params.permit(:category_id, :min_price, :max_price, :in_stock)
  end
end`,
        serviceObject: `
module Products
  class CreateService
    include ActiveModel::Model
    
    attr_accessor :name, :description, :price, :stock, :category_id, :user
    
    validates :name, presence: true, length: { maximum: 100 }
    validates :price, presence: true, numericality: { greater_than: 0 }
    validates :stock, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :user, presence: true
    
    def call
      return failure(errors.full_messages) unless valid?
      
      ActiveRecord::Base.transaction do
        product = create_product
        create_audit_log(product)
        notify_subscribers(product)
        index_product(product)
        
        success(product)
      end
    rescue StandardError => e
      Rails.logger.error "Product creation failed: #{e.message}"
      failure(['An error occurred while creating the product'])
    end
    
    private
    
    def create_product
      Product.create!(
        name: name,
        description: description,
        price: price,
        stock: stock,
        category_id: category_id,
        created_by: user
      )
    end
    
    def create_audit_log(product)
      AuditLog.create!(
        user: user,
        action: 'create',
        auditable: product,
        changes: product.attributes
      )
    end
    
    def notify_subscribers(product)
      ProductMailer.with(product: product)
                   .new_product_notification
                   .deliver_later
                   
      ProductNotificationJob.perform_later(product.id)
    end
    
    def index_product(product)
      ProductIndexer.perform_async(product.id)
    end
    
    def success(product)
      OpenStruct.new(success?: true, product: product, errors: [])
    end
    
    def failure(errors)
      OpenStruct.new(success?: false, product: nil, errors: errors)
    end
  end
end

# Usage in controller
def create
  service = Products::CreateService.new(
    product_params.merge(user: current_user)
  )
  
  result = service.call
  
  if result.success?
    render json: result.product, status: :created
  else
    render json: { errors: result.errors }, 
           status: :unprocessable_entity
  end
end`,
        backgroundJob: `
class ProductSyncJob < ApplicationJob
  queue_as :default
  
  retry_on Net::OpenTimeout, wait: :exponentially_longer, attempts: 5
  discard_on ActiveJob::DeserializationError
  
  def perform(product_id)
    product = Product.find(product_id)
    
    with_error_handling do
      sync_with_external_service(product)
      update_cache(product)
      notify_completion(product)
    end
  end
  
  private
  
  def sync_with_external_service(product)
    response = ExternalAPI.client.update_product(
      id: product.external_id,
      name: product.name,
      price: product.price,
      stock: product.stock
    )
    
    product.update!(
      last_synced_at: Time.current,
      sync_status: response.success? ? 'synced' : 'failed',
      sync_error: response.error_message
    )
  end
  
  def update_cache(product)
    Rails.cache.write(
      "product:#{product.id}",
      product.to_json,
      expires_in: 1.hour
    )
    
    Redis.current.zadd(
      'products:by_price',
      product.price,
      product.id
    )
  end
  
  def notify_completion(product)
    ActionCable.server.broadcast(
      "product_#{product.id}",
      {
        event: 'sync_completed',
        product: ProductSerializer.new(product).as_json
      }
    )
  end
  
  def with_error_handling
    yield
  rescue StandardError => e
    ErrorReporter.report(e, {
      job: self.class.name,
      product_id: arguments.first
    })
    raise
  end
end`
      }
    };
  },

  getOtherLanguagesExpertise() {
    return {
      php: this.getPHPExpertise(),
      swift: this.getSwiftExpertise(),
      kotlin: this.getKotlinExpertise(),
      rust: this.getRustExpertise(),
      typescript: this.getTypeScriptExpertise(),
      elixir: this.getElixirExpertise()
    };
  },

  getPHPExpertise() {
    return {
      core: {
        syntax: 'PHP 8.3, attributes, named arguments, union types, enums',
        paradigms: 'Object-oriented, functional, procedural',
        runtime: 'Zend Engine, OPcache, JIT compilation',
        ecosystem: 'Composer, PEAR, PECL, PSR standards'
      },
      frameworks: {
        web: ['Laravel', 'Symfony', 'Slim', 'Lumen', 'CodeIgniter'],
        cms: ['WordPress', 'Drupal', 'Joomla', 'Magento'],
        testing: ['PHPUnit', 'Pest', 'Codeception', 'Behat']
      },
      capabilities: [
        'Build Laravel applications',
        'Create WordPress plugins and themes',
        'Develop REST APIs',
        'Build e-commerce platforms',
        'Create content management systems'
      ],
      bestPractices: [
        'Follow PSR standards',
        'Use type declarations',
        'Implement proper error handling',
        'Use Composer for dependencies',
        'Apply SOLID principles'
      ]
    };
  },

  getSwiftExpertise() {
    return {
      core: {
        syntax: 'Swift 5.9, async/await, actors, macros, property wrappers',
        paradigms: 'Protocol-oriented, functional, object-oriented',
        runtime: 'ARC, Swift runtime, LLVM',
        ecosystem: 'Swift Package Manager, CocoaPods, Carthage'
      },
      frameworks: {
        ios: ['SwiftUI', 'UIKit', 'Combine', 'Core Data', 'CloudKit'],
        server: ['Vapor', 'Perfect', 'Kitura'],
        testing: ['XCTest', 'Quick', 'Nimble']
      },
      capabilities: [
        'Build iOS/macOS applications',
        'Create SwiftUI interfaces',
        'Develop tvOS/watchOS apps',
        'Build server-side Swift applications',
        'Create Swift packages'
      ],
      bestPractices: [
        'Use value types when appropriate',
        'Apply protocol-oriented design',
        'Handle optionals safely',
        'Use async/await for concurrency',
        'Follow Swift API design guidelines'
      ]
    };
  },

  getKotlinExpertise() {
    return {
      core: {
        syntax: 'Kotlin 1.9, coroutines, sealed classes, data classes, extensions',
        paradigms: 'Object-oriented, functional, concurrent',
        runtime: 'JVM, Android Runtime, Kotlin/Native, Kotlin/JS',
        ecosystem: 'Gradle, Maven, KotlinX libraries'
      },
      frameworks: {
        android: ['Jetpack Compose', 'Android SDK', 'Hilt', 'Room'],
        backend: ['Ktor', 'Spring Boot', 'Exposed', 'Kodein'],
        testing: ['JUnit', 'MockK', 'Kotest', 'Espresso']
      },
      capabilities: [
        'Build Android applications',
        'Create Jetpack Compose UIs',
        'Develop Kotlin Multiplatform apps',
        'Build server applications with Ktor',
        'Create DSLs and libraries'
      ],
      bestPractices: [
        'Use null safety features',
        'Apply extension functions wisely',
        'Use coroutines for async code',
        'Leverage data classes',
        'Follow Kotlin coding conventions'
      ]
    };
  },

  getRustExpertise() {
    return {
      core: {
        syntax: 'Rust 1.75, ownership, lifetimes, traits, async/await',
        paradigms: 'Systems programming, functional, concurrent',
        runtime: 'Zero-cost abstractions, no garbage collector',
        ecosystem: 'Cargo, crates.io, rustup'
      },
      frameworks: {
        web: ['Actix-web', 'Rocket', 'Axum', 'Warp', 'Tide'],
        async: ['Tokio', 'async-std', 'smol'],
        embedded: ['embedded-hal', 'cortex-m', 'esp-rs'],
        testing: ['built-in tests', 'proptest', 'criterion']
      },
      capabilities: [
        'Build systems software',
        'Create web services',
        'Develop embedded systems',
        'Build CLI tools',
        'Create WebAssembly modules'
      ],
      bestPractices: [
        'Follow ownership rules',
        'Use Result for error handling',
        'Minimize unsafe code',
        'Write comprehensive tests',
        'Use clippy for linting'
      ]
    };
  },

  getTypeScriptExpertise() {
    return {
      core: {
        syntax: 'TypeScript 5.3, decorators, type inference, generics',
        paradigms: 'Static typing, OOP, functional',
        compiler: 'tsc, type checking, declaration files',
        ecosystem: 'npm, yarn, pnpm, DefinitelyTyped'
      },
      frameworks: {
        frontend: ['React', 'Angular', 'Vue', 'Svelte'],
        backend: ['NestJS', 'Express', 'Fastify'],
        testing: ['Jest', 'Vitest', 'Cypress']
      },
      capabilities: [
        'Build type-safe applications',
        'Create React/Angular/Vue apps',
        'Develop Node.js backends',
        'Build libraries with .d.ts files',
        'Create type-safe APIs'
      ],
      bestPractices: [
        'Use strict mode',
        'Avoid any type',
        'Use interfaces over type aliases',
        'Apply utility types',
        'Write comprehensive type definitions'
      ]
    };
  },

  getElixirExpertise() {
    return {
      core: {
        syntax: 'Elixir 1.15, pattern matching, actors, OTP',
        paradigms: 'Functional, concurrent, fault-tolerant',
        runtime: 'BEAM VM, Erlang runtime',
        ecosystem: 'Mix, Hex, Phoenix Framework'
      },
      frameworks: {
        web: ['Phoenix', 'Plug', 'Absinthe'],
        testing: ['ExUnit', 'Wallaby', 'Mox'],
        tools: ['LiveView', 'Ecto', 'GenServer']
      },
      capabilities: [
        'Build Phoenix web applications',
        'Create real-time systems with LiveView',
        'Develop distributed systems',
        'Build IoT applications with Nerves',
        'Create fault-tolerant services'
      ],
      bestPractices: [
        'Use pattern matching effectively',
        'Apply OTP principles',
        'Write pure functions',
        'Use supervisors for fault tolerance',
        'Follow Elixir style guide'
      ]
    };
  }
};

module.exports = languageExpertise;