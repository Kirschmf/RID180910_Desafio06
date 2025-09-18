-- DNCommerce Sample Data
-- Dados de exemplo para teste do sistema

USE dncommerce;

-- Limpar dados existentes (cuidado em produção!)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE vendas;
TRUNCATE TABLE pedido_itens;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE estoque;
TRUNCATE TABLE produtos;
TRUNCATE TABLE clientes;
SET FOREIGN_KEY_CHECKS = 1;

-- Inserir produtos de beleza
INSERT INTO produtos (nome, descricao, preco, categoria, marca, ativo) VALUES
-- Maquiagem
('Base Líquida Matte', 'Base de longa duração com acabamento matte, cobertura média a alta', 45.90, 'maquiagem', 'Ruby Rose', TRUE),
('Batom Líquido Vermelho', 'Batom líquido de longa duração, cor vermelha clássica', 18.50, 'maquiagem', 'Eudora', TRUE),
('Paleta de Sombras Nude', 'Paleta com 12 tons nude para looks naturais e sofisticados', 89.90, 'maquiagem', 'Natura', TRUE),
('Rímel Volume Intenso', 'Rímel que proporciona volume e alongamento aos cílios', 32.90, 'maquiagem', 'O Boticário', TRUE),
('Pó Compacto Translúcido', 'Pó compacto para fixar a maquiagem e controlar oleosidade', 28.90, 'maquiagem', 'Avon', TRUE),

-- Skincare
('Sérum Vitamina C', 'Sérum antioxidante com vitamina C para iluminar a pele', 65.90, 'skincare', 'SKINCEUTICALS', TRUE),
('Hidratante Facial FPS 60', 'Hidratante com proteção solar para uso diário', 42.90, 'skincare', 'Eucerin', TRUE),
('Água Micelar', 'Água micelar para limpeza e remoção de maquiagem', 24.90, 'skincare', 'Garnier', TRUE),
('Esfoliante Facial', 'Esfoliante suave para renovação celular', 35.90, 'skincare', 'Neutrogena', TRUE),
('Máscara Facial Hidratante', 'Máscara intensiva para hidratação profunda', 19.90, 'skincare', 'The Face Shop', TRUE),

-- Cabelo
('Shampoo Hidratante', 'Shampoo para cabelos secos e ressecados', 28.90, 'cabelo', 'Pantene', TRUE),
('Condicionador Reparador', 'Condicionador para cabelos danificados', 31.90, 'cabelo', 'Elseve', TRUE),
('Máscara Capilar Nutritiva', 'Máscara de tratamento intensivo para cabelos', 45.90, 'cabelo', 'Kerastase', TRUE),
('Óleo Capilar Argan', 'Óleo de argan para nutrição e brilho', 38.90, 'cabelo', 'Moroccanoil', TRUE),
('Leave-in Protetor Térmico', 'Leave-in com proteção térmica para cabelos', 26.90, 'cabelo', 'TRESemmé', TRUE),

-- Perfume
('Perfume Floral Feminino', 'Fragrância floral delicada para o dia a dia', 89.90, 'perfume', 'Natura', TRUE),
('Perfume Amadeirado Masculino', 'Fragrância amadeirada sofisticada', 125.90, 'perfume', 'O Boticário', TRUE),
('Perfume Cítrico Unissex', 'Fragrância cítrica refrescante', 78.90, 'perfume', 'Eudora', TRUE),
('Body Splash Frutal', 'Body splash com fragrância frutal', 32.90, 'perfume', 'Avon', TRUE),

-- Corpo
('Hidratante Corporal', 'Hidratante para pele seca com manteiga de karité', 24.90, 'corpo', 'Nivea', TRUE),
('Sabonete Líquido Hidratante', 'Sabonete líquido com glicerina', 18.90, 'corpo', 'Dove', TRUE),
('Esfoliante Corporal', 'Esfoliante com açúcar para renovação da pele', 29.90, 'corpo', 'Granado', TRUE),
('Óleo Corporal Nutritivo', 'Óleo corporal para pele muito seca', 35.90, 'corpo', 'Johnson\'s', TRUE),
('Desodorante Antitranspirante', 'Desodorante com proteção 48h', 12.90, 'corpo', 'Rexona', TRUE);

-- Inserir clientes
INSERT INTO clientes (nome, email, telefone, endereco, ativo) VALUES
('Maria Silva Santos', 'maria.silva@email.com', '(11) 99999-1234', 'Rua das Flores, 123 - São Paulo, SP', TRUE),
('Ana Paula Oliveira', 'ana.paula@email.com', '(21) 98888-5678', 'Av. Copacabana, 456 - Rio de Janeiro, RJ', TRUE),
('Carla Mendes Costa', 'carla.mendes@email.com', '(31) 97777-9012', 'Rua da Liberdade, 789 - Belo Horizonte, MG', TRUE),
('Juliana Ferreira', 'juliana.ferreira@email.com', '(41) 96666-3456', 'Av. Paulista, 1011 - Curitiba, PR', TRUE),
('Fernanda Lima', 'fernanda.lima@email.com', '(51) 95555-7890', 'Rua dos Andradas, 1213 - Porto Alegre, RS', TRUE),
('Beatriz Almeida', 'beatriz.almeida@email.com', '(61) 94444-1234', 'SQN 304, Bloco A - Brasília, DF', TRUE),
('Camila Rodrigues', 'camila.rodrigues@email.com', '(71) 93333-5678', 'Rua Chile, 1415 - Salvador, BA', TRUE),
('Larissa Santos', 'larissa.santos@email.com', '(81) 92222-9012', 'Av. Boa Viagem, 1617 - Recife, PE', TRUE),
('Gabriela Costa', 'gabriela.costa@email.com', '(85) 91111-3456', 'Rua Dragão do Mar, 1819 - Fortaleza, CE', TRUE),
('Renata Souza', 'renata.souza@email.com', '(62) 90000-7890', 'Av. T-4, 2021 - Goiânia, GO', TRUE);

-- Inserir estoque inicial
INSERT INTO estoque (produto_id, quantidade, estoque_minimo) VALUES
(1, 50, 10),   -- Base Líquida Matte
(2, 75, 15),   -- Batom Líquido Vermelho
(3, 30, 5),    -- Paleta de Sombras Nude
(4, 60, 12),   -- Rímel Volume Intenso
(5, 45, 10),   -- Pó Compacto Translúcido
(6, 25, 5),    -- Sérum Vitamina C
(7, 40, 8),    -- Hidratante Facial FPS 60
(8, 80, 15),   -- Água Micelar
(9, 35, 7),    -- Esfoliante Facial
(10, 55, 10),  -- Máscara Facial Hidratante
(11, 70, 15),  -- Shampoo Hidratante
(12, 65, 12),  -- Condicionador Reparador
(13, 20, 5),   -- Máscara Capilar Nutritiva
(14, 15, 3),   -- Óleo Capilar Argan
(15, 45, 10),  -- Leave-in Protetor Térmico
(16, 25, 5),   -- Perfume Floral Feminino
(17, 18, 3),   -- Perfume Amadeirado Masculino
(18, 22, 5),   -- Perfume Cítrico Unissex
(19, 40, 8),   -- Body Splash Frutal
(20, 90, 20),  -- Hidratante Corporal
(21, 85, 18),  -- Sabonete Líquido Hidratante
(22, 30, 6),   -- Esfoliante Corporal
(23, 25, 5),   -- Óleo Corporal Nutritivo
(24, 100, 25); -- Desodorante Antitranspirante

-- Inserir alguns pedidos de exemplo
INSERT INTO pedidos (cliente_id, observacoes) VALUES
(1, 'Primeira compra da cliente'),
(2, 'Cliente VIP - entrega expressa'),
(3, 'Presente de aniversário'),
(4, NULL),
(5, 'Compra para revenda');

-- Inserir itens dos pedidos
INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES
-- Pedido 1 (Maria Silva)
(1, 1, 1, 45.90),  -- Base Líquida Matte
(1, 2, 2, 18.50),  -- Batom Líquido Vermelho
(1, 8, 1, 24.90),  -- Água Micelar

-- Pedido 2 (Ana Paula)
(2, 3, 1, 89.90),  -- Paleta de Sombras Nude
(2, 6, 1, 65.90),  -- Sérum Vitamina C
(2, 7, 1, 42.90),  -- Hidratante Facial FPS 60

-- Pedido 3 (Carla Mendes)
(3, 11, 1, 28.90), -- Shampoo Hidratante
(3, 12, 1, 31.90), -- Condicionador Reparador
(3, 13, 1, 45.90), -- Máscara Capilar Nutritiva

-- Pedido 4 (Juliana Ferreira)
(4, 16, 1, 89.90), -- Perfume Floral Feminino
(4, 20, 2, 24.90), -- Hidratante Corporal

-- Pedido 5 (Fernanda Lima)
(5, 4, 3, 32.90),  -- Rímel Volume Intenso
(5, 5, 2, 28.90),  -- Pó Compacto Translúcido
(5, 24, 5, 12.90); -- Desodorante Antitranspirante

-- Inserir vendas para os pedidos
INSERT INTO vendas (pedido_id, valor_total, desconto, forma_pagamento) VALUES
(1, 107.80, 5.00, 'cartao_credito'),    -- Pedido 1 com desconto
(2, 198.70, 0.00, 'pix'),               -- Pedido 2 sem desconto
(3, 106.70, 10.00, 'cartao_debito'),    -- Pedido 3 com desconto
(4, 139.70, 0.00, 'transferencia'),     -- Pedido 4 sem desconto
(5, 222.20, 15.00, 'dinheiro');         -- Pedido 5 com desconto

-- Atualizar status dos pedidos vendidos
UPDATE pedidos SET status = 'confirmado' WHERE id IN (1, 2, 3, 4, 5);

-- Inserir mais alguns pedidos pendentes
INSERT INTO pedidos (cliente_id, observacoes) VALUES
(6, 'Aguardando confirmação de pagamento'),
(7, 'Pedido em análise'),
(8, 'Cliente solicitou orçamento');

INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES
-- Pedido 6 (Beatriz Almeida)
(6, 9, 1, 35.90),   -- Esfoliante Facial
(6, 10, 2, 19.90),  -- Máscara Facial Hidratante

-- Pedido 7 (Camila Rodrigues)
(7, 14, 1, 38.90),  -- Óleo Capilar Argan
(7, 15, 1, 26.90),  -- Leave-in Protetor Térmico

-- Pedido 8 (Larissa Santos)
(8, 17, 1, 125.90), -- Perfume Amadeirado Masculino
(8, 18, 1, 78.90),  -- Perfume Cítrico Unissex
(8, 19, 1, 32.90);  -- Body Splash Frutal

COMMIT;

-- Verificar dados inseridos
SELECT 'Produtos inseridos:' as info, COUNT(*) as total FROM produtos;
SELECT 'Clientes inseridos:' as info, COUNT(*) as total FROM clientes;
SELECT 'Pedidos criados:' as info, COUNT(*) as total FROM pedidos;
SELECT 'Itens de pedidos:' as info, COUNT(*) as total FROM pedido_itens;
SELECT 'Vendas realizadas:' as info, COUNT(*) as total FROM vendas;
SELECT 'Produtos em estoque:' as info, COUNT(*) as total FROM estoque;

-- Mostrar resumo do estoque
SELECT 
    p.nome,
    p.categoria,
    e.quantidade,
    e.estoque_minimo,
    CASE 
        WHEN e.quantidade <= e.estoque_minimo THEN 'ATENÇÃO: Estoque baixo!'
        WHEN e.quantidade = 0 THEN 'CRÍTICO: Sem estoque!'
        ELSE 'OK'
    END as status
FROM produtos p
JOIN estoque e ON p.id = e.produto_id
ORDER BY e.quantidade ASC;
