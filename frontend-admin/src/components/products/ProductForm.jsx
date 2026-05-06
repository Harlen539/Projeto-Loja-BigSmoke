import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";

const empty = {
  name: "",
  category: "",
  price: "",
  promotionalPrice: "",
  cost: "",
  stock: "",
  stockType: "limited",
  image: "",
  images: [],
  description: "",
  sizes: "",
  badge: "",
  active: true,
  featured: false,
  weight: "",
  length: "",
  width: "",
  height: "",
  mpn: "",
  ageGroup: "",
  gender: "",
  tags: "",
  sku: "",
  barcode: "",
  productType: "physical",
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pf-section">
      <button type="button" className="pf-section-toggle" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className="pf-chevron">{open ? "∧" : "∨"}</span>
      </button>
      {open && <div className="pf-section-body">{children}</div>}
    </div>
  );
}

export function ProductForm({ product, onCancel, onSubmit }) {
  const { token } = useAuth();
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (product) {
      setForm({
        ...empty,
        ...product,
        sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes || "",
        images: Array.isArray(product.images) ? product.images : [],
        stockType: product.stock === -1 || product.stockType === "infinite" ? "infinite" : "limited",
        tags: Array.isArray(product.tags) ? product.tags.join(", ") : product.tags || "",
      });
    } else {
      setForm(empty);
    }
  }, [product]);

  function update(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch("/api/admin/uploads", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (data.imageUrl) {
          setForm((cur) => {
            const imgs = [...(cur.images || [])];
            if (!imgs.includes(data.imageUrl)) imgs.push(data.imageUrl);
            return { ...cur, image: cur.image || data.imageUrl, images: imgs };
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url) {
    setForm((cur) => {
      const imgs = (cur.images || []).filter((i) => i !== url);
      return { ...cur, images: imgs, image: cur.image === url ? imgs[0] || "" : cur.image };
    });
  }

  function submit(e) {
    e.preventDefault();
    const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    onSubmit({
      ...form,
      price: Number(form.price || 0),
      promotionalPrice: form.promotionalPrice ? Number(form.promotionalPrice) : null,
      cost: form.cost ? Number(form.cost) : null,
      stock: form.stockType === "infinite" ? -1 : Number(form.stock || 0),
      stockType: form.stockType,
      active: Boolean(form.active),
      featured: Boolean(form.featured),
      weight: form.weight ? Number(form.weight) : null,
      length: form.length ? Number(form.length) : null,
      width: form.width ? Number(form.width) : null,
      height: form.height ? Number(form.height) : null,
      tags,
    });
  }

  const margin =
    form.price && form.cost
      ? (((Number(form.price) - Number(form.cost)) / Number(form.price)) * 100).toFixed(1)
      : null;

  return (
    <div className="pf-overlay">
      <div className="pf-drawer">
        <div className="pf-header">
          <h2>{product ? "Editar produto" : "Novo produto"}</h2>
          <button className="pf-close" type="button" onClick={onCancel}>✕</button>
        </div>
        <form className="pf-body" onSubmit={submit}>

          <Section title="Nome e descrição">
            <div className="pf-field">
              <label>Nome</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Jaqueta de couro" required />
            </div>
            <div className="pf-field">
              <label>Descrição</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descreva o produto..." rows={4} />
            </div>
          </Section>

          <Section title="Fotos e vídeo">
            <div className="pf-dropzone" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileUpload} />
              <span className="pf-dropzone-icon">⊕</span>
              <span>{uploading ? "Enviando..." : "Selecione fotos do produto"}</span>
              <small>Tamanho mínimo: 1280px — WEBP, PNG, JPEG ou GIF</small>
            </div>
            {(form.images || []).length > 0 && (
              <div className="pf-image-grid">
                {form.images.map((img) => (
                  <div key={img} className={`pf-img-thumb${form.image === img ? " pf-img-main" : ""}`}>
                    <img src={img} alt="" onClick={() => update("image", img)} />
                    {form.image === img && <span className="pf-img-main-badge">Principal</span>}
                    <button type="button" className="pf-img-remove" onClick={() => removeImage(img)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="pf-field" style={{ marginTop: "0.75rem" }}>
              <label>URL da imagem</label>
              <input value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="https://..." />
            </div>
          </Section>

          <Section title="Preços">
            <div className="pf-row-2">
              <div className="pf-field">
                <label>Preço de venda</label>
                <div className="pf-input-prefix">
                  <span>R$</span>
                  <input value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0,00" required type="number" step="0.01" min="0" />
                </div>
              </div>
              <div className="pf-field">
                <label>Preço promocional</label>
                <div className="pf-input-prefix">
                  <span>R$</span>
                  <input value={form.promotionalPrice} onChange={(e) => update("promotionalPrice", e.target.value)} placeholder="0,00" type="number" step="0.01" min="0" />
                </div>
              </div>
            </div>
            <div className="pf-row-2">
              <div className="pf-field">
                <label>Custo <small>(uso interno)</small></label>
                <div className="pf-input-prefix">
                  <span>R$</span>
                  <input value={form.cost} onChange={(e) => update("cost", e.target.value)} placeholder="0,00" type="number" step="0.01" min="0" />
                </div>
              </div>
              <div className="pf-field">
                <label>Margem de lucro</label>
                <div className="pf-margin-display">{margin !== null ? `${margin}%` : "—"}</div>
              </div>
            </div>
          </Section>

          <Section title="Tipo de produto">
            <div className="pf-radio-group">
              {[["physical","Físico"],["digital","Digital / serviço"]].map(([v,l]) => (
                <label key={v} className={`pf-radio${form.productType === v ? " active" : ""}`}>
                  <input type="radio" name="productType" value={v} checked={form.productType === v} onChange={() => update("productType", v)} />
                  {l}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Inventário">
            <label className="pf-label-sm">Estoque</label>
            <div className="pf-radio-group">
              {[["infinite","Infinito"],["limited","Limitado"]].map(([v,l]) => (
                <label key={v} className={`pf-radio${form.stockType === v ? " active" : ""}`}>
                  <input type="radio" name="stockType" value={v} checked={form.stockType === v} onChange={() => update("stockType", v)} />
                  {l}
                </label>
              ))}
            </div>
            {form.stockType === "limited" && (
              <div className="pf-field" style={{ marginTop: "0.75rem" }}>
                <label>Quantidade</label>
                <input value={form.stock} onChange={(e) => update("stock", e.target.value)} placeholder="0" type="number" min="0" />
              </div>
            )}
            <div className="pf-field" style={{ marginTop: "0.75rem" }}>
              <label>Tamanhos <small>(separados por vírgula)</small></label>
              <input value={form.sizes} onChange={(e) => update("sizes", e.target.value)} placeholder="P, M, G, GG" />
            </div>
          </Section>

          <Section title="Códigos" defaultOpen={false}>
            <div className="pf-row-2">
              <div className="pf-field">
                <label>SKU</label>
                <input value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="BS-001" />
                <small>Código interno de controle com variações.</small>
              </div>
              <div className="pf-field">
                <label>Código de barras</label>
                <input value={form.barcode} onChange={(e) => update("barcode", e.target.value)} placeholder="EAN / UPC" />
              </div>
            </div>
          </Section>

          <Section title="Categorias e variações" defaultOpen={false}>
            <div className="pf-field">
              <label>Categoria</label>
              <input value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Moletons" required />
              <small>Ajuda seus clientes a encontrarem produtos mais rápido.</small>
            </div>
            <div className="pf-field" style={{ marginTop: "0.75rem" }}>
              <label>Badge / variação</label>
              <input value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="Mais pedido, Novo, BigSmoke" />
              <small>Combina diferentes propriedades: cor + tamanho.</small>
            </div>
          </Section>

          <Section title="Tags, Marca e SEO" defaultOpen={false}>
            <div className="pf-field">
              <label>Tags <small>(separadas por vírgula)</small></label>
              <input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="streetwear, moletom" />
              <small>Crie palavras-chave para facilitar a busca na loja e nos buscadores Google.</small>
            </div>
          </Section>

          <Section title="Peso e dimensões" defaultOpen={false}>
            <small className="pf-hint">Preencha para calcular o custo de envio dos produtos e mostrar os meios de envio na sua loja.</small>
            <div className="pf-row-2" style={{ marginTop: "0.75rem" }}>
              <div className="pf-field">
                <label>Peso</label>
                <div className="pf-input-suffix"><input value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="0.14" type="number" step="0.001" min="0" /><span>kg</span></div>
              </div>
              <div className="pf-field">
                <label>Comprimento</label>
                <div className="pf-input-suffix"><input value={form.length} onChange={(e) => update("length", e.target.value)} placeholder="30" type="number" min="0" /><span>cm</span></div>
              </div>
            </div>
            <div className="pf-row-2">
              <div className="pf-field">
                <label>Largura</label>
                <div className="pf-input-suffix"><input value={form.width} onChange={(e) => update("width", e.target.value)} placeholder="30" type="number" min="0" /><span>cm</span></div>
              </div>
              <div className="pf-field">
                <label>Altura</label>
                <div className="pf-input-suffix"><input value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="30" type="number" min="0" /><span>cm</span></div>
              </div>
            </div>
          </Section>

          <Section title="Instagram e Google Shopping" defaultOpen={false}>
            <small className="pf-hint">Destaque seus produtos nas vitrines virtuais do Instagram e do Google gratuitamente.</small>
            <div className="pf-field" style={{ marginTop: "0.75rem" }}>
              <label>MPN</label>
              <input value={form.mpn} onChange={(e) => update("mpn", e.target.value)} placeholder="Definir" />
            </div>
            <div className="pf-row-2">
              <div className="pf-field">
                <label>Faixa etária</label>
                <select value={form.ageGroup} onChange={(e) => update("ageGroup", e.target.value)}>
                  <option value="">Selecione a faixa etária</option>
                  <option value="adult">Adulto</option>
                  <option value="teen">Adolescente</option>
                  <option value="kids">Criança</option>
                </select>
              </div>
              <div className="pf-field">
                <label>Sexo</label>
                <select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option value="">Selecione o sexo</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="unisex">Unissex</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Destacar produto" defaultOpen={false}>
            <small className="pf-hint">Escolha em quais seções da loja você quer destacar este produto.</small>
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
              <label className="pf-checkbox-label">
                <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
                Produto em destaque
              </label>
              <label className="pf-checkbox-label">
                <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
                Produto ativo (visível na loja)
              </label>
            </div>
          </Section>

          <div className="pf-footer">
            <button type="button" className="pf-btn-cancel" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="pf-btn-save">✓ Salvar produto</button>
          </div>
        </form>
      </div>
    </div>
  );
}
