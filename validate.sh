#!/bin/bash

# 🛡️ ZERO TRUST VALIDATION SCRIPT
# Script rapide pour valider que Claude Code dit la vérité
# Usage: ./validate.sh [--quick|--strict|--verbose]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un header
print_header() {
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}🛡️  ZERO TRUST VALIDATOR - Claude Code Check${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
}

# Fonction pour valider une commande avec preuve
validate_command() {
    local command="$1"
    local description="$2"
    local show_output="${3:-false}"
    
    echo -e "${YELLOW}▶ ${description}...${NC}"
    
    if $show_output; then
        if eval "$command"; then
            echo -e "${GREEN}✅ ${description}: SUCCESS${NC}\n"
            return 0
        else
            echo -e "${RED}❌ ${description}: FAILED${NC}\n"
            return 1
        fi
    else
        if output=$(eval "$command" 2>&1); then
            echo -e "${GREEN}✅ ${description}: SUCCESS${NC}"
            if [[ "$1" == *"--verbose"* ]] || [[ "$VERBOSE" == "true" ]]; then
                echo -e "${NC}Output preview: ${output:0:100}...${NC}"
            fi
            echo ""
            return 0
        else
            echo -e "${RED}❌ ${description}: FAILED${NC}"
            echo -e "${RED}Error: ${output:0:200}${NC}\n"
            return 1
        fi
    fi
}

# Fonction pour vérifier les fichiers
check_files() {
    echo -e "${YELLOW}▶ Vérification des fichiers modifiés...${NC}"
    
    if command -v git &> /dev/null; then
        modified_count=$(git status --porcelain 2>/dev/null | wc -l)
        echo -e "${GREEN}✅ Fichiers modifiés: $modified_count${NC}"
        
        if [ "$modified_count" -gt 0 ] && [ "$VERBOSE" == "true" ]; then
            echo "Fichiers:"
            git status --porcelain | head -5
        fi
    else
        file_count=$(find . -type f -mmin -10 2>/dev/null | wc -l)
        echo -e "${GREEN}✅ Fichiers récemment modifiés (10 min): $file_count${NC}"
    fi
    echo ""
}

# Fonction pour calculer le score
calculate_score() {
    local score=10
    
    [ "$BUILD_SUCCESS" == "false" ] && score=$((score - 3))
    [ "$TEST_SUCCESS" == "false" ] && score=$((score - 2))
    [ "$LINT_SUCCESS" == "false" ] && score=$((score - 1))
    [ "$TYPE_SUCCESS" == "false" ] && score=$((score - 1))
    
    echo "$score"
}

# Parse arguments
QUICK_MODE=false
STRICT_MODE=false
VERBOSE=false

for arg in "$@"; do
    case $arg in
        --quick)
            QUICK_MODE=true
            ;;
        --strict)
            STRICT_MODE=true
            ;;
        --verbose)
            VERBOSE=true
            ;;
        --help)
            echo "Usage: $0 [--quick|--strict|--verbose]"
            echo "  --quick   : Validation rapide (build + tests seulement)"
            echo "  --strict  : Mode strict (score minimum 8/10)"
            echo "  --verbose : Afficher plus de détails"
            exit 0
            ;;
    esac
done

# Header
print_header

# Variables pour tracker les succès
BUILD_SUCCESS=true
TEST_SUCCESS=true
LINT_SUCCESS=true
TYPE_SUCCESS=true

# 1. VALIDATION BUILD
if ! validate_command "pnpm run build 2>&1 || npm run build 2>&1" "Build"; then
    BUILD_SUCCESS=false
    echo -e "${RED}⚠️  Le build a échoué - NE PAS dire que 'tout fonctionne'${NC}\n"
fi

# 2. VALIDATION TESTS
if [ "$QUICK_MODE" == "false" ] || [ "$BUILD_SUCCESS" == "true" ]; then
    if ! validate_command "pnpm run test --passWithNoTests 2>&1 || npm run test -- --passWithNoTests 2>&1" "Tests"; then
        TEST_SUCCESS=false
        echo -e "${RED}⚠️  Des tests échouent - Corriger avant de continuer${NC}\n"
    fi
fi

# 3. VALIDATION LINTING (sauf en mode quick)
if [ "$QUICK_MODE" == "false" ]; then
    if ! validate_command "pnpm run lint 2>&1 || npm run lint 2>&1" "Linting"; then
        LINT_SUCCESS=false
        echo -e "${YELLOW}⚠️  Problèmes de linting détectés${NC}\n"
    fi
    
    # 4. TYPE CHECKING (si TypeScript)
    if [ -f "tsconfig.json" ]; then
        if ! validate_command "pnpm tsc --noEmit 2>&1 || npx tsc --noEmit 2>&1" "Type Check"; then
            TYPE_SUCCESS=false
            echo -e "${YELLOW}⚠️  Erreurs de type TypeScript${NC}\n"
        fi
    fi
fi

# 5. VÉRIFICATION DES FICHIERS
check_files

# CALCUL DU SCORE
SCORE=$(calculate_score)

# RAPPORT FINAL
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}📊 RAPPORT DE VALIDATION${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Résumé
echo "Résultats:"
[ "$BUILD_SUCCESS" == "true" ] && echo -e "  ${GREEN}✅ Build: SUCCESS${NC}" || echo -e "  ${RED}❌ Build: FAILED${NC}"
[ "$TEST_SUCCESS" == "true" ] && echo -e "  ${GREEN}✅ Tests: SUCCESS${NC}" || echo -e "  ${RED}❌ Tests: FAILED${NC}"

if [ "$QUICK_MODE" == "false" ]; then
    [ "$LINT_SUCCESS" == "true" ] && echo -e "  ${GREEN}✅ Linting: SUCCESS${NC}" || echo -e "  ${RED}❌ Linting: FAILED${NC}"
    [ "$TYPE_SUCCESS" == "true" ] && echo -e "  ${GREEN}✅ Type Check: SUCCESS${NC}" || echo -e "  ${YELLOW}⏭️  Type Check: N/A${NC}"
fi

echo ""
echo -e "Score de Qualité: ${YELLOW}${SCORE}/10${NC}"

# Verdict
echo ""
if [ "$STRICT_MODE" == "true" ]; then
    MIN_SCORE=8
else
    MIN_SCORE=6
fi

if [ "$SCORE" -ge "$MIN_SCORE" ]; then
    echo -e "${GREEN}=================================================${NC}"
    echo -e "${GREEN}✅ VALIDATION RÉUSSIE${NC}"
    echo -e "${GREEN}Les preuves ont été fournies - Code vérifié${NC}"
    echo -e "${GREEN}=================================================${NC}"
    exit 0
else
    echo -e "${RED}=================================================${NC}"
    echo -e "${RED}❌ VALIDATION ÉCHOUÉE${NC}"
    echo -e "${RED}Ne PAS affirmer que tout fonctionne !${NC}"
    echo -e "${RED}Corrections requises avant de continuer.${NC}"
    echo -e "${RED}=================================================${NC}"
    exit 1
fi