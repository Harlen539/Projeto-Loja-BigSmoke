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
  productType: "physical",
};

const Icon = {
  NameDesc: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h10M3 15h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  ),
  Photos: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="7" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14l4-4 3 3 3-3 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Prices: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v1.5M10 12.5V14M7.5 8.5C7.5 7.67 8.17 7 9 7h2a1.5 1.5 0 010 3H9a1.5 1.5 0 000 3h2c.83 0 1.5-.67 1.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
  ),
  ProductType: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3" y="7" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7V5.5a3 3 0 016 0V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  Inventory: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2L3 6v8l7 4 7-4V6L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 6l7 4 7-4M10 10v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  ),
  Categories: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  Tags: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 10.5V4a1 1 0 011-1h6.5a1 1 0 01.7.3l5.5 5.5a1 1 0 010 1.4l-5.5 5.5a1 1 0 01-1.4 0l-5.5-5.5A1 1 0 013 10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="7" cy="7.5" r="1" fill="currentColor"/></svg>
  ),
  Dimensions: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 7h14M7 3v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  ),
  Social: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.4"/><circle cx="14.5" cy="5.5" r="1" fill="currentColor"/></svg>
  ),
  Featured: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14.3l-4.8 2.6.9-5.4L2.2 7.7l5.4-.8L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  Upload: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 16V8M12 8l-3 3M12 8l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  Chevron: ({ open }) => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5L16 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
};

function Section({ icon: IconComp, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pf-section">
      <button type="button" className="pf-section-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="pf-section-icon">{IconComp && <IconComp />}</span>
        <span className="pf-section-title">{title}</span>
        <span className="pf-section-chevron"><Icon.Chevron open={open} /></span>
      </button>
      <div className={"pf-section-body" + (open ? " open" : "")}>
        <div className="pf-section-inner">{children}</div>
      </div>
    </div>
  );
}

export function ProductForm({ product, onCancel, onSubmit }) {
  const { token } = useAuth();
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [showPriceInStore, setShowPriceInStore] = useState(true);
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
          <div className="pf-header-info">
            <h2 className="pf-title">{product ? "Editar produto" : "Novo produto"}</h2>
            <p className="pf-subtitle">{product ? "Atualize as informações do produto" : "Preencha os dados do novo produto"}</p>
          </div>
          <button className="pf-close" type="button" onClick={onCancel} aria-label="Fechar">
            <Icon.Close />
          </button>
        </div>

        <form className="pf-body" onSubmit={submit}>
          <Section icon={Icon.NameDesc} title="Nome e descrição" defaultOpen={true}>
            <div className="pf-field">
              <label className="pf-label">Nome do produto <span className="pf-required">*</span></label>
              <input className="pf-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Jaqueta de couro BigSmoke" required />
            </div>
            <div className="pf-field">
              <label className="pf-label">Descrição</label>
              <textarea className="pf-textarea" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descreva o produto com detalhes..." rows={4} />
            </div>
          </Section>

          <Section icon={Icon.Photos} title="Fotos do produto" defaultOpen={true}>
            <div className="pf-dropzone" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileUpload} />
              <div className="pf-dropzone-icon"><Icon.Upload /></div>
              <div className="pf-dropzone-text">
                <span>{uploading ? "Enviando imagens..." : "Clique para selecionar fotos"}</span>
                <small>WEBP, PNG, JPEG ou GIF — tamanho mínimo 1280px</small>
              </div>
            </div>
            {(form.images || []).length > 0 && (
              <div className="pf-image-grid">
                {form.images.map((img) => (
                  <div key={img} className={"pf-img-thumb" + (form.image === img ? " pf-img-main" : "")}>
                    <img src={img} alt="" onClick={() => update("image", img)} />
                    {form.image === img && <span className="pf-img-main-badge">Principal</span>}
                    <button type="button" className="pf-img-remove" onClick={() => removeImage(img)}><Icon.Close /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="pf-field" style={{ marginTop: "0.75rem" }}>
              <label className="pf-label">URL da imagem</label>
              <input className="pf-input" value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="https://..." />
            </div>
          </Section>

          <Section icon={Icon.Prices} title="Preços" defaultOpen={true}>
            <div className="pf-row-2">
              <div className="pf-field">
                <label className="pf-label">Preço de venda <span className="pf-required">*</span></label>
                <div className="pf-input-prefix"><span>R$</span><input className="pf-input" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" required type="number" step="0.01" min="0" /></div>
              </div>
              <div className="pf-field">
                <label className="pf-label">Preço promocional</label>
                <div className="pf-input-prefix"><span>R$</span><input className="pf-input" value={form.promotionalPrice} onChange={(e) => update("promotionalPrice", e.target.value)} placeholder="0.00" type="number" step="0.01" min="0" /></div>
              </div>
            </div>
            <div className="pf-checkbox-inline">
              <label className="pf-checkbox-label">
                <input type="checkbox" checked={showPriceInStore} onChange={(e) => setShowPriceInStore(e.target.checked)} />
                <span className="pf-checkbox-box">{showPriceInStore && <Icon.Check />}</span>
                Exibir o preço na loja
              </label>
            </div>
            <div className="pf-row-2">
              <div className="pf-field">
                <label className="pf-label">Custo <small className="pf-label-hint">(uso interno)</small></label>
                <div className="pf-input-prefix"><span>R$</span><input className="pf-input" value={form.cost} onChange={(e) => update("cost", e.target.value)} placeholder="0.00" type="number" step="0.01" min="0" /></div>
                <small className="pf-hint">Seus clientes não verão na loja.</small>
              </div>
              <div className="pf-field">
                <label className="pf-label">Margem de lucro</label>
                <div className={"pf-margin-display" + (margin !== null ? (Number(margin) > 0 ? " positive" : " negative") : "")}>
                  {margin !== null ? margin + "%" : "—"}
                </div>
              </div>
            </div>
          </Section>

          <Section icon={Icon.ProductType} title="Tipo de produto" defaultOpen={true}>
            <div className="pf-radio-group">
              {[["physical","Físico"],["digital","Digital / serviço"]].map(([v,l]) => (
                <label key={v} className={"pf-radio" + (form.productType === v ? " active" : "")}>
                  <input type="radio" name="productType" value={v} checked={form.productType === v} onChange={() => update("productType", v)} />
                  <span className="pf-radio-dot" />{l}
                </label>
              ))}
            </div>
          </Section>

          <Section icon={Icon.Inventory} title="Inventário" defaultOpen={false}>
            <label className="pf-label" style={{ marginBottom: "0.5rem", display: "block" }}>Estoque</label>
            <div className="pf-radio-group">
              {[["infinite","Infinito"],["limited","Limitado"]].map(([v,l]) => (
                <label key={v} className={"pf-radio" + (form.stockType === v ? " active" : "")}>
                  <input type="radio" name="stockType" value={v} checked={form.stockType === v} onChange={() => update("stockType", v)} />
                  <span className="pf-radio-dot" />{l}
                </label>
              ))}
            </div>
            {form.stockType === "limited" && (
              <div className="pf-field" style={{ marginTop: "0.75rem" }}>
                <label className="pf-label">Quantidade em estoque</label>
                <input className="pf-input" value={form.stock} onChange={(e) => update("stock", e.target.value)} placeholder="0" type="number" min="0" />
              </div>
            )}
            <div className="pf-field" style={{ marginTop: "0.75rem" }}>
              <label className="pf-label">Tamanhos <small className="pf-label-hint">(separados por vírgula)</small></label>
              <input className="pf-input" value={form.sizes} onChange={(e) => update("sizes", e.target.value)} placeholder="P, M, G, GG, XGG" />
            </div>
          </Section>

          <Section icon={Icon.Categories} title="Categorias e variações" defaultOpen={false}>
            <div className="pf-field">
              <label className="pf-label">Categoria <span className="pf-required">*</span></label>
              <input className="pf-input" value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Ex: Moletons, Camisetas..." required />
              <small className="pf-hint">Ajuda seus clientes a encontrarem produtos mais rápido.</small>
            </div>
            <div className="pf-field" style={{ marginTop: "0.75rem" }}>
              <label className="pf-label">Badge / variação</label>
              <input className="pf-input" value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="Mais pedido, Novo, BigSmoke" />
              <small className="pf-hint">Combina diferentes propriedades: cor + tamanho.</small>
            </div>
          </Section>

          <Section icon={Icon.Tags} title="Tags, Marca e SEO" defaultOpen={false}>
            <div className="pf-field">
              <label className="pf-label">Tags <small className="pf-label-hint">(separadas por vírgula)</small></label>
              <input className="pf-input" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="streetwear, moletom, bigsmoke" />
              <small className="pf-hint">Crie palavras-chave para facilitar a busca na loja e no Google.</small>
            </div>
          </Section>

          <Section icon={Icon.Dimensions} title="Peso e dimensões" defaultOpen={false}>
            <small className="pf-hint" style={{ display: "block", marginBottom: "0.75rem" }}>Preencha para calcular o custo de envio e mostrar os meios de envio na sua loja.</small>
            <div className="pf-row-2">
              <div className="pf-field">
                <label className="pf-label">Peso</label>
                <div className="pf-input-suffix"><input className="pf-input" value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="0.14" type="number" step="0.001" min="0" /><span>kg</span></div>
              </div>
              <div className="pf-field">
                <label className="pf-label">Comprimento</label>
                <div className="pf-input-suffix"><input className="pf-input" value={form.length} onChange={(e) => update("length", e.target.value)} placeholder="30" type="number" min="0" /><span>cm</span></div>
              </div>
            </div>
            <div className="pf-row-2">
              <div className="pf-field">
                <label className="pf-label">Largura</label>
                <div className="pf-input-suffix"><input className="pf-input" value={form.width} onChange={(e) => update("width", e.target.value)} placeholder="30" type="number" min="0" /><span>cm</span></div>
              </div>
              <div className="pf-field">
                <label className="pf-label">Altura</label>
                <div className="pf-input-suffix"><input className="pf-input" value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="30" type="number" min="0" /><span>cm</span></div>
              </div>
            </div>
          </Section>

          <Section icon={Icon.Social} title="Instagram e Google Shopping" defaultOpen={false}>
            <small className="pf-hint" style={{ display: "block", marginBottom: "0.75rem" }}>Destaque seus produtos nas vitrines virtuais do Instagram e do Google gratuitamente.</small>
            <div className="pf-field">
              <label className="pf-label">MPN</label>
              <input className="pf-input" value={form.mpn} onChange={(e) => update("mpn", e.target.value)} placeholder="Definir MPN" />
            </div>
            <div className="pf-row-2" style={{ marginTop: "0.75rem" }}>
              <div className="pf-field">
                <label className="pf-label">Faixa etária</label>
                <select className="pf-select" value={form.ageGroup} onChange={(e) => update("ageGroup", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="adult">Adulto</option>
                  <option value="teen">Adolescente</option>
                  <option value="kids">Criança</option>
                </select>
              </div>
              <div className="pf-field">
                <label className="pf-label">Sexo</label>
                <select className="pf-select" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="unisex">Unissex</option>
                </select>
              </div>
            </div>
          </Section>

          <Section icon={Icon.Featured} title="Destacar produto" defaultOpen={false}>
            <small className="pf-hint" style={{ display: "block", marginBottom: "0.75rem" }}>Escolha em quais seções da loja você quer destacar este produto.</small>
            <div className="pf-checks-stack">
              <label className="pf-checkbox-label">
                <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
                <span className="pf-checkbox-box">{form.featured && <Icon.Check />}</span>
                Produto em destaque
              </label>
              <label className="pf-checkbox-label">
                <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
                <span className="pf-checkbox-box">{form.active && <Icon.Check />}</span>
                Produto ativo (visível na loja)
              </label>
            </div>
          </Section>

          <div className="pf-footer">
            <button type="button" className="pf-btn-cancel" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="pf-btn-save"><Icon.Check /> Salvar produto</button>
          </div>
        </form>
      </div>
    </div>
  );
}
