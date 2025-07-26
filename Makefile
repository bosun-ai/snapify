# ForSURE Frontend - Makefile
# Combines the most important commands from README.txt

# Load configuration
-include config.env
export

.PHONY: help install setup rebuild dev dev-first clean status config preflight

# Default target
help:
	@echo "ForSURE Frontend - Available commands:"
	@echo ""
	@echo "  make install    - Install all dependencies (python3-venv)"
	@echo "  make setup      - Setup Python virtual environment and Node environment"
	@echo "  make rebuild    - Force rebuild environments (clean + setup)"
	@echo "  make dev        - Start Shopify theme development server"
	@echo "  make dev-first  - First time setup with store URL"
	@echo "  make clean      - Clean up virtual environments"
	@echo "  make status     - Check environment status"
	@echo "  make config     - Show current configuration"
	@echo "  make help       - Show this help message"
	@echo ""

# Install dependencies
install:
	@echo "Installing python3-venv"
	sudo apt install python3-venv
	@echo "Installation complete!"

# Setup Python and Node environments (skip if exists)
setup:
	@if [ -d ".venv" ] && [ -d ".nodeenv" ]; then \
		echo "Environments already exist. Skipping setup."; \
		echo "Use 'make rebuild' to force recreation."; \
	else \
		echo "Setting up Python virtual environment..."; \
		python3 -m venv .venv; \
		echo "Activating Python virtual environment..."; \
		. .venv/bin/activate && pip install nodeenv; \
		echo "Setting up Node environment..."; \
		. .venv/bin/activate && nodeenv .nodeenv; \
		echo "Activating Node environment..."; \
		. .nodeenv/bin/activate && npm install -g @shopify/cli@latest; \
		echo "Setup complete!"; \
		echo ""; \
		echo "To activate environments manually:"; \
		echo "  . .venv/bin/activate && . .nodeenv/bin/activate"; \
	fi

# Force rebuild environments
rebuild:
	@echo "Force rebuilding environments..."
	$(MAKE) clean
	$(MAKE) setup

# Preflight check for versions and config
preflight:
	@echo "==== Preflight Check ===="
	@echo "Current working directory: $$(pwd)"
	@echo "Config file: $$(readlink -f config.env 2>/dev/null || echo 'config.env not found')"
	@echo ""
	@echo "[Python (.venv)]"
	@echo "Python version: $$(. .venv/bin/activate && python --version 2>&1)"
	@echo "Python path: $$(. .venv/bin/activate && which python)"
	@echo "nodeenv version: $$(. .venv/bin/activate && pip show nodeenv 2>/dev/null | grep ^Version: | awk '{print $$2}' || echo 'not installed')"
	@echo ""
	@echo "[Node.js (.nodeenv)]"
	@echo "Node.js version: $$(. .nodeenv/bin/activate && node -v)"
	@echo "Node path: $$(. .nodeenv/bin/activate && which node)"
	@echo "npm version: $$(. .nodeenv/bin/activate && npm -v)"
	@echo "npm path: $$(. .nodeenv/bin/activate && which npm)"
	@echo ""
	@echo "[Shopify CLI (.nodeenv)]"
	@echo "Shopify CLI version: $$(. .nodeenv/bin/activate && shopify version 2>/dev/null || echo 'not found')"
	@echo "Shopify CLI path: $$(. .nodeenv/bin/activate && which shopify 2>/dev/null || echo 'not found')"

	@echo ""
	@echo "[Config]"
	@echo "Store URL: $(SHOPIFY_STORE_URL)"
	@echo "========================="

# Start development server (normal mode)
dev:
	@if [ ! -d ".venv" ] || [ ! -d ".nodeenv" ]; then \
		echo "Environments not found. Running setup first..."; \
		$(MAKE) setup; \
	fi
	$(MAKE) preflight
	@echo "Starting Shopify theme development server..."
	. .venv/bin/activate && . .nodeenv/bin/activate && shopify theme dev

# First time development setup with store URL
dev-first:
	@if [ ! -d ".venv" ] || [ ! -d ".nodeenv" ]; then \
		echo "Environments not found. Running setup first..."; \
		$(MAKE) setup; \
	fi
	@if [ -z "$(SHOPIFY_STORE_URL)" ]; then \
		echo "Error: SHOPIFY_STORE_URL not set in config.env"; \
		exit 1; \
	fi
	$(MAKE) preflight
	@echo "Starting Shopify theme development server (first time)..."
	@echo "Store URL: $(SHOPIFY_STORE_URL)"
	. .venv/bin/activate && . .nodeenv/bin/activate && shopify theme dev --store=$(SHOPIFY_STORE_URL)

# Clean up virtual environments
clean:
	@echo "Cleaning up virtual environments..."
	rm -rf .venv
	rm -rf .nodeenv
	@echo "Cleanup complete!"

# Check environment status
status:
	@echo "Checking environment status..."
	@echo "Python virtual environment:"
	@if [ -d ".venv" ]; then echo "  ✓ .venv exists"; else echo "  ✗ .venv missing"; fi
	@echo "Node environment:"
	@if [ -d ".nodeenv" ]; then echo "  ✓ .nodeenv exists"; else echo "  ✗ .nodeenv missing"; fi
	@echo "Shopify CLI:"
	@if command -v shopify >/dev/null 2>&1; then echo "  ✓ Shopify CLI installed"; else echo "  ✗ Shopify CLI not found"; fi
	@echo "Node.js:"
	@if command -v node >/dev/null 2>&1; then echo "  ✓ Node.js installed ($(shell node -v))"; else echo "  ✗ Node.js not found"; fi
	@echo "npm:"
	@if command -v npm >/dev/null 2>&1; then echo "  ✓ npm installed ($(shell npm -v))"; else echo "  ✗ npm not found"; fi

# Show current configuration
config:
	@echo "Current Configuration:"
	@echo "====================="
	@if [ -f "config.env" ]; then \
		echo "config.env file exists"; \
		echo "SHOPIFY_STORE_URL: $(SHOPIFY_STORE_URL)"; \
	else \
		echo "config.env file not found"; \
		echo "Please create config.env with SHOPIFY_STORE_URL"; \
	fi 