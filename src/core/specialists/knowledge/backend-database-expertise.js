/**
 * BUMBA Backend & Database Specialists Expertise
 * Enhanced knowledge for Backend Engineering, Database Design, and API Development specialists
 * Sprint 18 Implementation
 */

class BackendDatabaseExpertise {
  /**
   * Backend Engineering Expert Knowledge
   */
  static getBackendEngineeringExpertise() {
    return {
      name: 'Backend Engineering Expert',
      expertise: {
        core: {
          server_development: 'Node.js, Python, Java, Go, Rust, C#, scalable server architecture',
          api_design: 'RESTful APIs, GraphQL, gRPC, OpenAPI/Swagger, API versioning, documentation',
          microservices: 'Microservices architecture, service mesh, distributed systems, event-driven design',
          performance: 'Performance optimization, caching strategies, load balancing, horizontal scaling',
          security: 'Authentication, authorization, encryption, input validation, security best practices'
        },
        
        frameworks: {
          nodejs: 'Express.js, Fastify, Nest.js, Koa.js, TypeScript, async/await patterns',
          python: 'Django, FastAPI, Flask, SQLAlchemy, Pydantic, async programming',
          java: 'Spring Boot, Spring Framework, Hibernate, Maven/Gradle, JPA',
          go: 'Gin, Echo, Gorilla, GORM, Go modules, concurrent programming',
          csharp: '.NET Core, ASP.NET, Entity Framework, dependency injection'
        },
        
        databases: {
          relational: 'PostgreSQL, MySQL, SQLite, database design, ACID properties, transactions',
          nosql: 'MongoDB, Redis, Elasticsearch, DynamoDB, document and key-value stores',
          caching: 'Redis, Memcached, application-level caching, cache invalidation strategies',
          orm: 'Prisma, TypeORM, Sequelize, SQLAlchemy, Hibernate, database migrations'
        },
        
        infrastructure: {
          containerization: 'Docker, Kubernetes, container orchestration, microservice deployment',
          cloud_services: 'AWS, Azure, GCP backend services, serverless functions, managed databases',
          monitoring: 'Application monitoring, logging, metrics, observability, error tracking',
          deployment: 'CI/CD pipelines, blue-green deployment, canary releases, infrastructure as code'
        }
      },
      
      capabilities: [
        'RESTful and GraphQL API development',
        'Microservices architecture design and implementation',
        'Database design and optimization',
        'Authentication and authorization systems',
        'Caching strategies and performance optimization',
        'Containerization and orchestration with Docker/Kubernetes',
        'Cloud-native backend development',
        'Message queues and event-driven architecture',
        'Backend testing strategies and automation',
        'Security implementation and vulnerability management',
        'Monitoring and observability setup',
        'Scalable system architecture design',
        'Database migration and schema management',
        'API documentation and developer experience',
        'Performance profiling and optimization',
        'Distributed system design and coordination'
      ],
      
      systemPromptAdditions: `
You are a Backend Engineering expert specializing in:
- Scalable server-side application development with modern frameworks
- RESTful and GraphQL API design and implementation
- Microservices architecture and distributed systems
- Database design, optimization, and management
- Security implementation and best practices
- Performance optimization and caching strategies
- Cloud-native development and deployment

Always focus on scalability, security, performance, and maintainability in backend systems.`,

      bestPractices: [
        'Design APIs with clear RESTful principles and proper HTTP status codes',
        'Implement comprehensive input validation and sanitization',
        'Use proper authentication and authorization mechanisms',
        'Implement database transactions and handle edge cases gracefully',
        'Design for horizontal scalability and stateless services',
        'Use caching strategies effectively to improve performance',
        'Implement proper error handling and logging throughout the application',
        'Follow the principle of least privilege for security',
        'Use environment variables for configuration management',
        'Implement comprehensive testing including unit, integration, and e2e tests',
        'Use database migrations for schema changes',
        'Implement proper monitoring and observability',
        'Follow SOLID principles and clean architecture patterns',
        'Use containerization for consistent deployment environments',
        'Implement proper backup and disaster recovery strategies'
      ],
      
      codePatterns: {
        nodeExpressAPI: `
# Node.js Express API with TypeScript

## Project Structure and Setup
\`\`\`typescript
// src/app.ts - Main application setup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { json, urlencoded } from 'body-parser';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { productRoutes } from './routes/products';
import { connectDatabase } from './config/database';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
\`\`\`

## Database Layer with Prisma
\`\`\`typescript
// prisma/schema.prisma - Database schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      UserRole @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders Order[]
  reviews Review[]

  @@map("users")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Decimal  @db.Decimal(10, 2)
  category    String
  imageUrl    String?
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderItems OrderItem[]
  reviews    Review[]

  @@map("products")
}

model Order {
  id        String      @id @default(cuid())
  userId    String
  status    OrderStatus @default(PENDING)
  total     Decimal     @db.Decimal(10, 2)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user       User        @relation(fields: [userId], references: [id])
  orderItems OrderItem[]

  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

// src/services/userService.ts - Service layer
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export class UserService {
  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateUser(id: string, updateData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
  }>) {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    return user;
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }
}
\`\`\`

## Authentication Middleware
\`\`\`typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new AppError('Access token required', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new AppError('Invalid token', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Rate limiting for sensitive endpoints
export const createStrictRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
\`\`\`

## Error Handling and Validation
\`\`\`typescript
// src/utils/AppError.ts
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = \`\${statusCode}\`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let err = { ...error };
  err.message = error.message;

  // Log error
  console.error(error);

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const message = 'Duplicate field value entered';
      err = new AppError(message, 400);
    } else if (error.code === 'P2025') {
      const message = 'Record not found';
      err = new AppError(message, 404);
    }
  }

  // Validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const message = 'Invalid input data';
    err = new AppError(message, 400);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new AppError(message, 401);
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new AppError(message, 401);
  }

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  res.status(statusCode).json({
    status,
    error: {
      message: err.message || 'Something went wrong',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};

// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/AppError';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

// Validation schemas
export const userValidation = {
  create: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  
  update: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    email: Joi.string().email(),
  }),
};
\`\`\``,

        fastAPIBackend: `
# FastAPI Python Backend

## Application Setup
\`\`\`python
# main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
import logging
from datetime import datetime

from .database import database, create_tables
from .routes import auth, users, products
from .middleware import TimingMiddleware, LoggingMiddleware
from .core.config import settings
from .core.exceptions import AppException, exception_handler

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await database.connect()
    await create_tables()
    logger.info("Database connected and tables created")
    yield
    # Shutdown
    await database.disconnect()
    logger.info("Database disconnected")

app = FastAPI(
    title="E-commerce API",
    description="A scalable e-commerce backend API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(TimingMiddleware)
app.add_middleware(LoggingMiddleware)

# Exception handlers
app.add_exception_handler(AppException, exception_handler)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(products.router, prefix="/api/products", tags=["products"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT,
        "database": "connected" if database.is_connected else "disconnected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )
\`\`\`

## Database Models with SQLAlchemy
\`\`\`python
# models/user.py
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from ..database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"

# models/product.py
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    image_url = Column(String(500))
    stock = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name})>"

# models/order.py
from sqlalchemy import Column, String, Numeric, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from ..database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")
\`\`\`

## Service Layer with Dependency Injection
\`\`\`python
# services/user_service.py
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

from ..models.user import User, UserRole
from ..schemas.user import UserCreate, UserUpdate, UserResponse
from ..core.config import settings
from ..core.exceptions import AppException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def create_user(self, user_data: UserCreate) -> UserResponse:
        # Check if user exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise AppException("User with this email already exists", status_code=400)

        # Hash password
        hashed_password = self._hash_password(user_data.password)

        # Create user
        user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )

        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError:
            self.db.rollback()
            raise AppException("Failed to create user", status_code=500)

        return UserResponse.from_orm(user)

    async def authenticate_user(self, email: str, password: str) -> dict:
        user = self.db.query(User).filter(
            User.email == email,
            User.is_active == True
        ).first()

        if not user or not self._verify_password(password, user.password_hash):
            raise AppException("Invalid credentials", status_code=401)

        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()

        # Generate token
        token = self._create_access_token({"sub": str(user.id), "role": user.role})

        return {
            "user": UserResponse.from_orm(user),
            "access_token": token,
            "token_type": "bearer"
        }

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        user = self.db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()

        if not user:
            raise AppException("User not found", status_code=404)

        return UserResponse.from_orm(user)

    async def update_user(self, user_id: str, user_data: UserUpdate) -> UserResponse:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise AppException("User not found", status_code=404)

        # Update fields
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        try:
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError:
            self.db.rollback()
            raise AppException("Failed to update user", status_code=500)

        return UserResponse.from_orm(user)

    async def get_users(self, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        users = self.db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
        return [UserResponse.from_orm(user) for user in users]

    def _hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def _create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})

        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

# Dependency to get user service
def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)
\`\`\`

## API Routes with Dependency Injection
\`\`\`python
# routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

from ..schemas.user import UserResponse, UserUpdate
from ..services.user_service import UserService, get_user_service
from ..core.auth import get_current_user, require_roles
from ..models.user import User, UserRole

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    return UserResponse.from_orm(current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Update current user's profile"""
    return await user_service.update_user(str(current_user.id), user_data)

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MODERATOR])),
    user_service: UserService = Depends(get_user_service)
):
    """Get all users (admin/moderator only)"""
    return await user_service.get_users(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MODERATOR])),
    user_service: UserService = Depends(get_user_service)
):
    """Get user by ID (admin/moderator only)"""
    return await user_service.get_user_by_id(user_id)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    user_service: UserService = Depends(get_user_service)
):
    """Update user by ID (admin only)"""
    return await user_service.update_user(user_id, user_data)
\`\`\`
      }
    };
  }
  
  /**
   * Database Design Expert Knowledge
   */
  static getDatabaseDesignExpertise() {
    return {
      name: 'Database Design Expert',
      expertise: {
        core: {
          relational_design: 'Normalization, entity-relationship modeling, ACID properties, referential integrity',
          nosql_design: 'Document stores, key-value stores, graph databases, column-family databases',
          performance: 'Indexing strategies, query optimization, partitioning, sharding, replication',
          migration: 'Schema migrations, data migrations, version control, rollback strategies',
          security: 'Data encryption, access controls, audit logging, compliance requirements'
        },
        
        relational_databases: {
          postgresql: 'Advanced PostgreSQL features, JSONB, arrays, custom types, extensions',
          mysql: 'MySQL/MariaDB optimization, replication, clustering, performance tuning',
          sqlite: 'SQLite for embedded applications, WAL mode, optimization techniques',
          sql_server: 'SQL Server features, T-SQL, stored procedures, indexing strategies',
          oracle: 'Oracle database features, PL/SQL, partitioning, enterprise features'
        },
        
        nosql_databases: {
          mongodb: 'Document modeling, aggregation pipelines, sharding, replica sets',
          redis: 'Data structures, caching patterns, pub/sub, clustering, persistence',
          elasticsearch: 'Search engine design, mapping, indexing, aggregations, performance',
          cassandra: 'Wide-column design, consistency levels, partitioning, time-series data',
          dynamodb: 'Single-table design, GSI/LSI, capacity planning, cost optimization'
        },
        
        database_operations: {
          backup_recovery: 'Backup strategies, point-in-time recovery, disaster recovery planning',
          monitoring: 'Performance monitoring, query analysis, slow query optimization',
          scaling: 'Horizontal scaling, read replicas, connection pooling, load balancing',
          maintenance: 'Regular maintenance tasks, statistics updates, index maintenance'
        }
      },
      
      capabilities: [
        'Relational database design and normalization',
        'NoSQL database design and data modeling',
        'Database performance optimization and tuning',
        'Indexing strategies and query optimization',
        'Database migration and schema management',
        'Backup and disaster recovery planning',
        'Database security and access control',
        'Database monitoring and maintenance',
        'Horizontal and vertical scaling strategies',
        'Data replication and high availability setup',
        'Database testing and validation',
        'Compliance and audit trail implementation',
        'Database documentation and standards',
        'Cross-database integration and ETL processes',
        'Database cost optimization',
        'Database architecture review and recommendations'
      ],
      
      systemPromptAdditions: `
You are a Database Design expert specializing in:
- Relational and NoSQL database design and architecture
- Database performance optimization and query tuning
- Schema design, normalization, and data modeling
- Database security, backup, and disaster recovery
- Scaling strategies and high availability implementation
- Database migration and maintenance procedures
- Modern database technologies and best practices

Always focus on data integrity, performance, scalability, and security in database design.`,

      bestPractices: [
        'Design normalized schemas to eliminate data redundancy',
        'Use appropriate data types and constraints for data integrity',
        'Implement proper indexing strategies for query performance',
        'Design for scalability and future growth requirements',
        'Implement comprehensive backup and disaster recovery plans',
        'Use database transactions appropriately for data consistency',
        'Implement proper security measures and access controls',
        'Monitor database performance and optimize queries regularly',
        'Use connection pooling to manage database connections efficiently',
        'Implement proper error handling and logging',
        'Use database migrations for schema changes',
        'Document database schema and relationships clearly',
        'Implement data validation at the database level',
        'Plan for data archiving and retention policies',
        'Test database performance under load conditions'
      ],
      
      codePatterns: {
        postgresqlDesign: `
# PostgreSQL Advanced Database Design

## Schema Design with Advanced Features
\`\`\`sql
-- Create custom types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Users table with advanced features
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status user_status DEFAULT 'pending',
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT name_length CHECK (length(trim(first_name)) >= 2 AND length(trim(last_name)) >= 2)
);

-- Products table with full-text search
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    attributes JSONB DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN DEFAULT true,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders table with partitioning
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status order_status DEFAULT 'pending',
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    currency CHAR(3) DEFAULT 'USD',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for orders
CREATE TABLE orders_2024_01 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE orders_2024_02 PARTITION OF orders
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Order items with composite primary key
CREATE TABLE order_items (
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    
    PRIMARY KEY (order_id, product_id)
);

-- Audit table for tracking changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE status != 'inactive';
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at DESC);

-- Partial index for active products with stock
CREATE INDEX idx_products_available ON products(name, price) 
    WHERE is_active = true AND stock > 0;
\`\`\`

## Triggers and Functions
\`\`\`sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_search_vector_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, operation, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, operation, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, operation, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
\`\`\`

## Advanced Queries and Procedures
\`\`\`sql
-- Complex query with CTEs and window functions
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', o.created_at) as month,
        p.category,
        SUM(oi.total_price) as total_sales,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(DISTINCT o.user_id) as unique_customers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status = 'delivered'
        AND o.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', o.created_at), p.category
),
ranked_categories AS (
    SELECT 
        month,
        category,
        total_sales,
        order_count,
        unique_customers,
        ROW_NUMBER() OVER (PARTITION BY month ORDER BY total_sales DESC) as rank,
        LAG(total_sales, 1) OVER (PARTITION BY category ORDER BY month) as prev_month_sales,
        SUM(total_sales) OVER (PARTITION BY category ORDER BY month 
                              ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as rolling_3_month_avg
    FROM monthly_sales
)
SELECT 
    month,
    category,
    total_sales,
    order_count,
    unique_customers,
    rank,
    ROUND(
        CASE 
            WHEN prev_month_sales IS NOT NULL AND prev_month_sales > 0 
            THEN ((total_sales - prev_month_sales) / prev_month_sales * 100)
            ELSE NULL 
        END, 2
    ) as month_over_month_growth_pct,
    ROUND(rolling_3_month_avg / 3, 2) as avg_3_month_sales
FROM ranked_categories
WHERE rank <= 5  -- Top 5 categories by sales each month
ORDER BY month DESC, rank;

-- Stored procedure for order processing
CREATE OR REPLACE FUNCTION process_order(
    p_user_id UUID,
    p_items JSONB,
    p_shipping_address JSONB,
    p_billing_address JSONB
) RETURNS TABLE (
    order_id UUID,
    total_amount DECIMAL,
    status TEXT
) AS $$
DECLARE
    v_order_id UUID;
    v_total DECIMAL := 0;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_unit_price DECIMAL;
    v_stock INTEGER;
BEGIN
    -- Create order
    INSERT INTO orders (user_id, status, total, shipping_address, billing_address)
    VALUES (p_user_id, 'pending', 0, p_shipping_address, p_billing_address)
    RETURNING id INTO v_order_id;
    
    -- Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        -- Check stock and get price
        SELECT stock, price INTO v_stock, v_unit_price
        FROM products 
        WHERE id = v_product_id AND is_active = true;
        
        IF v_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
        END IF;
        
        -- Insert order item
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (v_order_id, v_product_id, v_quantity, v_unit_price);
        
        -- Update stock
        UPDATE products 
        SET stock = stock - v_quantity 
        WHERE id = v_product_id;
        
        -- Add to total
        v_total := v_total + (v_quantity * v_unit_price);
    END LOOP;
    
    -- Update order total
    UPDATE orders SET total = v_total WHERE id = v_order_id;
    
    RETURN QUERY SELECT v_order_id, v_total, 'pending'::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Order processing failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function for product search with ranking
CREATE OR REPLACE FUNCTION search_products(
    p_search_query TEXT,
    p_category TEXT DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    category VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.category,
        ts_rank(p.search_vector, plainto_tsquery('english', p_search_query)) as rank
    FROM products p
    WHERE p.is_active = true
        AND p.stock > 0
        AND (p_category IS NULL OR p.category = p_category)
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        AND (p_search_query = '' OR p.search_vector @@ plainto_tsquery('english', p_search_query))
    ORDER BY 
        CASE WHEN p_search_query = '' THEN 0 ELSE ts_rank(p.search_vector, plainto_tsquery('english', p_search_query)) END DESC,
        p.name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
\`\`\`
      }
    };
  }
  
  /**
   * API Development Expert Knowledge
   */
  static getAPIDevelopmentExpertise() {
    return {
      name: 'API Development Expert',
      expertise: {
        core: {
          api_design: 'RESTful API design, resource modeling, HTTP methods, status codes, versioning',
          graphql: 'GraphQL schema design, resolvers, queries, mutations, subscriptions, federation',
          grpc: 'Protocol Buffers, service definition, streaming, error handling, load balancing',
          documentation: 'OpenAPI/Swagger, API documentation, developer portals, SDK generation',
          testing: 'API testing, contract testing, load testing, security testing, mocking'
        },
        
        api_patterns: {
          rest: 'Resource-based URLs, HATEOAS, content negotiation, caching headers, pagination',
          graphql: 'Schema-first design, DataLoader, query optimization, schema stitching',
          webhooks: 'Event-driven APIs, webhook security, retry mechanisms, payload validation',
          real_time: 'WebSockets, Server-Sent Events, real-time subscriptions, connection management'
        },
        
        security: {
          authentication: 'OAuth 2.0, JWT, API keys, basic auth, multi-factor authentication',
          authorization: 'RBAC, ABAC, scope-based access, resource-level permissions',
          protection: 'Rate limiting, DDoS protection, input validation, output encoding',
          encryption: 'TLS/SSL, data encryption, secure headers, certificate management'
        },
        
        operations: {
          monitoring: 'API metrics, logging, tracing, error tracking, performance monitoring',
          scaling: 'Load balancing, auto-scaling, caching strategies, CDN integration',
          versioning: 'API versioning strategies, backward compatibility, deprecation policies',
          governance: 'API lifecycle management, standards enforcement, compliance'
        }
      },
      
      capabilities: [
        'RESTful API design and implementation',
        'GraphQL schema design and resolver implementation',
        'gRPC service development and deployment',
        'API security and authentication systems',
        'API documentation and developer experience',
        'API testing and quality assurance',
        'API performance optimization and caching',
        'API versioning and lifecycle management',
        'Webhook and real-time API development',
        'API gateway configuration and management',
        'API monitoring and observability',
        'API rate limiting and throttling',
        'Cross-platform SDK development',
        'API compliance and governance',
        'API migration and integration strategies',
        'Developer portal creation and maintenance'
      ],
      
      systemPromptAdditions: `
You are an API Development expert specializing in:
- RESTful API design following industry best practices
- GraphQL schema design and efficient resolver implementation
- API security, authentication, and authorization
- API documentation and developer experience optimization
- API testing, monitoring, and performance optimization
- Modern API patterns including webhooks and real-time APIs
- API lifecycle management and governance

Always focus on developer experience, security, performance, and maintainability in API design.`,

      bestPractices: [
        'Design APIs with clear, consistent, and intuitive resource naming',
        'Use appropriate HTTP methods and status codes',
        'Implement comprehensive input validation and error handling',
        'Design for backward compatibility and proper versioning',
        'Implement proper authentication and authorization',
        'Use pagination for large data sets and implement filtering/sorting',
        'Provide comprehensive and up-to-date API documentation',
        'Implement rate limiting and throttling to prevent abuse',
        'Use appropriate caching strategies for performance',
        'Follow security best practices including HTTPS and input sanitization',
        'Implement proper logging and monitoring for observability',
        'Design APIs with consistent error response formats',
        'Use content negotiation for different response formats',
        'Implement proper CORS policies for browser-based applications',
        'Test APIs thoroughly including edge cases and error scenarios'
      ],
      
      codePatterns: {
        restfulAPI: `
# RESTful API Design and Implementation

## Express.js RESTful API
\`\`\`typescript
// routes/products.ts - RESTful Product API
import { Router, Request, Response, NextFunction } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { ProductService } from '../services/ProductService';
import { authenticate, authorize } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { cache } from '../middleware/cache';

const router = Router();
const productService = new ProductService();

// GET /api/v1/products - List products with filtering and pagination
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category').optional().isString().trim(),
    query('min_price').optional().isFloat({ min: 0 }),
    query('max_price').optional().isFloat({ min: 0 }),
    query('sort').optional().isIn(['name', 'price', 'created_at', '-name', '-price', '-created_at']),
    query('search').optional().isString().trim(),
  ],
  cache(300), // Cache for 5 minutes
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 20,
        category,
        min_price,
        max_price,
        sort = 'created_at',
        search
      } = req.query;

      const filters = {
        category: category as string,
        minPrice: min_price ? parseFloat(min_price as string) : undefined,
        maxPrice: max_price ? parseFloat(max_price as string) : undefined,
        search: search as string,
      };

      const result = await productService.getProducts({
        page: page as number,
        limit: limit as number,
        filters,
        sort: sort as string,
      });

      // Add pagination metadata
      const totalPages = Math.ceil(result.total / (limit as number));
      const hasNext = (page as number) < totalPages;
      const hasPrevious = (page as number) > 1;

      res.status(200).json({
        status: 'success',
        data: {
          products: result.products,
          pagination: {
            page: page as number,
            limit: limit as number,
            total: result.total,
            totalPages,
            hasNext,
            hasPrevious,
            nextPage: hasNext ? (page as number) + 1 : null,
            previousPage: hasPrevious ? (page as number) - 1 : null,
          },
        },
        links: {
          self: \`\${req.protocol}://\${req.get('host')}\${req.originalUrl}\`,
          ...(hasNext && {
            next: \`\${req.protocol}://\${req.get('host')}/api/v1/products?page=\${(page as number) + 1}&limit=\${limit}\`,
          }),
          ...(hasPrevious && {
            previous: \`\${req.protocol}://\${req.get('host')}/api/v1/products?page=\${(page as number) - 1}&limit=\${limit}\`,
          }),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/products/:id - Get specific product
router.get('/:id',
  [
    param('id').isUUID().withMessage('Invalid product ID format'),
  ],
  cache(600), // Cache for 10 minutes
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid product ID',
          errors: errors.array()
        });
      }

      const product = await productService.getProductById(req.params.id);

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      res.status(200).json({
        status: 'success',
        data: { product },
        links: {
          self: \`\${req.protocol}://\${req.get('host')}\${req.originalUrl}\`,
          collection: \`\${req.protocol}://\${req.get('host')}/api/v1/products\`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/products - Create new product
router.post('/',
  authenticate,
  authorize(['admin', 'manager']),
  rateLimiter(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  [
    body('name').isString().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('price').isFloat({ min: 0 }),
    body('category').isString().trim().isLength({ min: 1, max: 100 }),
    body('stock').optional().isInt({ min: 0 }),
    body('tags').optional().isArray(),
    body('tags.*').isString().trim(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const product = await productService.createProduct(req.body, req.user!.id);

      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: { product },
        links: {
          self: \`\${req.protocol}://\${req.get('host')}/api/v1/products/\${product.id}\`,
          collection: \`\${req.protocol}://\${req.get('host')}/api/v1/products\`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/products/:id - Update product
router.put('/:id',
  authenticate,
  authorize(['admin', 'manager']),
  [
    param('id').isUUID(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const product = await productService.updateProduct(req.params.id, req.body, req.user!.id);

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Product updated successfully',
        data: { product },
        links: {
          self: \`\${req.protocol}://\${req.get('host')}\${req.originalUrl}\`,
          collection: \`\${req.protocol}://\${req.get('host')}/api/v1/products\`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  [
    param('id').isUUID(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid product ID',
          errors: errors.array()
        });
      }

      const deleted = await productService.deleteProduct(req.params.id, req.user!.id);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as productRoutes };
\`\`\`

## OpenAPI/Swagger Documentation
\`\`\`yaml
# openapi.yaml - API Documentation
openapi: 3.0.3
info:
  title: E-commerce API
  description: A comprehensive e-commerce backend API
  version: 1.0.0
  contact:
    name: API Support
    email: api-support@ecommerce.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.ecommerce.com/v1
    description: Production server
  - url: https://staging-api.ecommerce.com/v1
    description: Staging server

paths:
  /products:
    get:
      summary: List products
      description: Retrieve a paginated list of products with optional filtering
      tags:
        - Products
      parameters:
        - name: page
          in: query
          description: Page number for pagination
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Number of items per page
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: category
          in: query
          description: Filter by product category
          required: false
          schema:
            type: string
        - name: min_price
          in: query
          description: Minimum price filter
          required: false
          schema:
            type: number
            minimum: 0
        - name: max_price
          in: query
          description: Maximum price filter
          required: false
          schema:
            type: number
            minimum: 0
        - name: sort
          in: query
          description: Sort order for results
          required: false
          schema:
            type: string
            enum: [name, price, created_at, -name, -price, -created_at]
            default: created_at
        - name: search
          in: query
          description: Search term for product name and description
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: success
                  data:
                    type: object
                    properties:
                      products:
                        type: array
                        items:
                          $ref: '#/components/schemas/Product'
                      pagination:
                        $ref: '#/components/schemas/PaginationMeta'
                  links:
                    $ref: '#/components/schemas/Links'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/InternalServerError'
    
    post:
      summary: Create a new product
      description: Create a new product (requires admin or manager role)
      tags:
        - Products
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductCreate'
      responses:
        '201':
          description: Product created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: success
                  message:
                    type: string
                    example: Product created successfully
                  data:
                    type: object
                    properties:
                      product:
                        $ref: '#/components/schemas/Product'
                  links:
                    $ref: '#/components/schemas/Links'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /products/{id}:
    get:
      summary: Get product by ID
      description: Retrieve a specific product by its ID
      tags:
        - Products
      parameters:
        - name: id
          in: path
          required: true
          description: Product ID
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Product found
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: success
                  data:
                    type: object
                    properties:
                      product:
                        $ref: '#/components/schemas/Product'
                  links:
                    $ref: '#/components/schemas/Links'
        '400':
          $ref: '#/components/responses/BadRequest'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
          example: 123e4567-e89b-12d3-a456-426614174000
        name:
          type: string
          example: Wireless Headphones
        description:
          type: string
          example: High-quality wireless headphones with noise cancellation
        price:
          type: number
          format: decimal
          example: 199.99
        category:
          type: string
          example: Electronics
        stock:
          type: integer
          example: 50
        tags:
          type: array
          items:
            type: string
          example: [wireless, audio, bluetooth]
        is_active:
          type: boolean
          example: true
        created_at:
          type: string
          format: date-time
          example: '2024-01-01T12:00:00Z'
        updated_at:
          type: string
          format: date-time
          example: '2024-01-01T12:00:00Z'

    ProductCreate:
      type: object
      required:
        - name
        - price
        - category
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: Wireless Headphones
        description:
          type: string
          maxLength: 2000
          example: High-quality wireless headphones
        price:
          type: number
          format: decimal
          minimum: 0
          example: 199.99
        category:
          type: string
          minLength: 1
          maxLength: 100
          example: Electronics
        stock:
          type: integer
          minimum: 0
          example: 50
        tags:
          type: array
          items:
            type: string

    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 20
        total:
          type: integer
          example: 100
        totalPages:
          type: integer
          example: 5
        hasNext:
          type: boolean
          example: true
        hasPrevious:
          type: boolean
          example: false
        nextPage:
          type: integer
          nullable: true
          example: 2
        previousPage:
          type: integer
          nullable: true
          example: null

    Links:
      type: object
      properties:
        self:
          type: string
          format: uri
          example: https://api.ecommerce.com/v1/products
        next:
          type: string
          format: uri
          nullable: true
          example: https://api.ecommerce.com/v1/products?page=2
        previous:
          type: string
          format: uri
          nullable: true
          example: null

    Error:
      type: object
      properties:
        status:
          type: string
          example: error
        message:
          type: string
          example: An error occurred
        errors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token for authentication
\`\`\`
      }
    };
  }
}

module.exports = BackendDatabaseExpertise;