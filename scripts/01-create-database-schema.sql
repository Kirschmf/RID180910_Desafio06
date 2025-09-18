-- DNCommerce Database Schema
-- Sistema de E-commerce para Produtos de Beleza

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS dncommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dncommerce;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    categoria ENUM('maquiagem', 'skincare', 'cabelo', 'perfume', 'corpo') NOT NULL,
    marca VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_categoria (categoria),
    INDEX idx_marca (marca),
    INDEX idx_ativo (ativo),
    INDEX idx_preco (preco),
    FULLTEXT idx_search (nome, descricao)
) ENGINE=InnoDB;

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    endereco TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_ativo (ativo),
    FULLTEXT idx_search_cliente (nome, email)
) ENGINE=InnoDB;

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('pendente', 'confirmado', 'enviado', 'entregue', 'cancelado') DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    INDEX idx_cliente (cliente_id),
    INDEX idx_status (status),
    INDEX idx_data (created_at)
) ENGINE=InnoDB;

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_produto (produto_id)
) ENGINE=InnoDB;

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2) GENERATED ALWAYS AS (valor_total - desconto) STORED,
    forma_pagamento ENUM('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia') NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_forma_pagamento (forma_pagamento),
    INDEX idx_data_venda (data_venda)
) ENGINE=InnoDB;

-- Tabela de Estoque
CREATE TABLE IF NOT EXISTS estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL UNIQUE,
    quantidade INT NOT NULL DEFAULT 0,
    estoque_minimo INT DEFAULT 5,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    INDEX idx_produto (produto_id),
    INDEX idx_quantidade (quantidade),
    INDEX idx_estoque_baixo (quantidade, estoque_minimo)
) ENGINE=InnoDB;

-- Triggers para atualização automática do estoque

DELIMITER //

-- Trigger para diminuir estoque quando venda é realizada
CREATE TRIGGER after_venda_insert 
AFTER INSERT ON vendas
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_produto_id INT;
    DECLARE v_quantidade INT;
    
    DECLARE cur CURSOR FOR 
        SELECT pi.produto_id, pi.quantidade 
        FROM pedido_itens pi 
        WHERE pi.pedido_id = NEW.pedido_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_produto_id, v_quantidade;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        UPDATE estoque 
        SET quantidade = quantidade - v_quantidade 
        WHERE produto_id = v_produto_id;
        
        -- Inserir registro se não existir
        INSERT IGNORE INTO estoque (produto_id, quantidade) 
        VALUES (v_produto_id, 0);
        
    END LOOP;
    
    CLOSE cur;
END//

-- Trigger para atualizar total do pedido
CREATE TRIGGER after_pedido_item_insert
AFTER INSERT ON pedido_itens
FOR EACH ROW
BEGIN
    UPDATE pedidos 
    SET total = (
        SELECT SUM(subtotal) 
        FROM pedido_itens 
        WHERE pedido_id = NEW.pedido_id
    )
    WHERE id = NEW.pedido_id;
END//

CREATE TRIGGER after_pedido_item_update
AFTER UPDATE ON pedido_itens
FOR EACH ROW
BEGIN
    UPDATE pedidos 
    SET total = (
        SELECT SUM(subtotal) 
        FROM pedido_itens 
        WHERE pedido_id = NEW.pedido_id
    )
    WHERE id = NEW.pedido_id;
END//

CREATE TRIGGER after_pedido_item_delete
AFTER DELETE ON pedido_itens
FOR EACH ROW
BEGIN
    UPDATE pedidos 
    SET total = COALESCE((
        SELECT SUM(subtotal) 
        FROM pedido_itens 
        WHERE pedido_id = OLD.pedido_id
    ), 0)
    WHERE id = OLD.pedido_id;
END//

DELIMITER ;

-- Views úteis

-- View para produtos com estoque
CREATE OR REPLACE VIEW produtos_estoque AS
SELECT 
    p.*,
    COALESCE(e.quantidade, 0) as quantidade_estoque,
    COALESCE(e.estoque_minimo, 5) as estoque_minimo,
    CASE 
        WHEN COALESCE(e.quantidade, 0) <= COALESCE(e.estoque_minimo, 5) THEN 'BAIXO'
        WHEN COALESCE(e.quantidade, 0) = 0 THEN 'ZERADO'
        ELSE 'OK'
    END as status_estoque
FROM produtos p
LEFT JOIN estoque e ON p.id = e.produto_id;

-- View para relatório de vendas
CREATE OR REPLACE VIEW relatorio_vendas AS
SELECT 
    v.*,
    p.cliente_id,
    c.nome as cliente_nome,
    c.email as cliente_email,
    p.total as pedido_total,
    p.status as pedido_status
FROM vendas v
JOIN pedidos p ON v.pedido_id = p.id
JOIN clientes c ON p.cliente_id = c.id;

-- Inserir estoque inicial para produtos existentes
INSERT IGNORE INTO estoque (produto_id, quantidade, estoque_minimo)
SELECT id, 0, 5 FROM produtos;

-- Índices adicionais para performance
CREATE INDEX idx_produtos_categoria_ativo ON produtos(categoria, ativo);
CREATE INDEX idx_produtos_marca_ativo ON produtos(marca, ativo);
CREATE INDEX idx_vendas_data_forma ON vendas(data_venda, forma_pagamento);
CREATE INDEX idx_pedidos_cliente_status ON pedidos(cliente_id, status);

COMMIT;
