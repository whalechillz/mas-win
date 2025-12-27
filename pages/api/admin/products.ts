import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// 공통으로 사용하는 컬럼 목록 (SELECT 시 재사용)
const PRODUCT_SELECT_COLUMNS =
  'id, name, sku, category, color, size, legacy_name, is_gift, is_sellable, is_active, normal_price, sale_price, is_component, condition, product_type, slug, subtitle, badge_left, badge_right, badge_left_color, badge_right_color, border_color, features, specifications, display_order, detail_images, composition_images, gallery_images';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
      case 'PATCH':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('[admin/products] UNEXPECTED ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const isGiftOnly = req.query.isGift === 'true';
    const includeInactive = req.query.includeInactive === 'true';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const isSellable =
      typeof req.query.isSellable === 'string' ? req.query.isSellable === 'true' : undefined;
    const isActive =
      typeof req.query.isActive === 'string' ? req.query.isActive === 'true' : undefined;
    const minPrice =
      typeof req.query.minPrice === 'string' ? Number(req.query.minPrice) : undefined;
    const maxPrice =
      typeof req.query.maxPrice === 'string' ? Number(req.query.maxPrice) : undefined;
    const isComponentParam = req.query.isComponent as string | undefined;
    const isComponent =
      isComponentParam === 'true' ? true : isComponentParam === 'false' ? false : undefined;
    const condition =
      typeof req.query.condition === 'string' ? req.query.condition.trim() : '';
    const productType =
      typeof req.query.productType === 'string' ? req.query.productType.trim() : '';

    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

    const allowedSortColumns = [
      'name',
      'sku',
      'category',
      'color',
      'size',
      'normal_price',
      'sale_price',
      'is_gift',
      'is_sellable',
      'is_active',
      'is_component',
      'condition',
    ];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
    const ascending = sortOrder === 'asc';

    let query = supabase
      .from('products')
      .select(PRODUCT_SELECT_COLUMNS)
      .order(sortColumn, { ascending });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    } else if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (isGiftOnly) {
      query = query.eq('is_gift', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (isSellable !== undefined) {
      query = query.eq('is_sellable', isSellable);
    }

    if (isComponent !== undefined) {
      query = query.eq('is_component', isComponent);
    }

    if (condition) {
      query = query.eq('condition', condition);
    }

    if (productType) {
      query = query.eq('product_type', productType);
    }

    if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
      query = query.gte('normal_price', minPrice);
    }
    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
      query = query.lte('normal_price', maxPrice);
    }

    if (q) {
      // 이름/sku/legacy_name 부분 검색
      query = query.or(
        `name.ilike.%${q}%,sku.ilike.%${q}%,legacy_name.ilike.%${q}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      products: data ?? [],
    });
  } catch (error: any) {
    console.error('[admin/products][GET] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 목록 조회에 실패했습니다.',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      name,
      sku,
      category,
      color,
      size,
      legacy_name,
      is_gift = false,
      is_sellable = false,
      is_active = true,
      normal_price,
      sale_price,
      is_component = false,
      condition = 'new',
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ success: false, message: '상품명(name)은 필수입니다.' });
    }

    const payload: any = {
      name,
      sku: sku || null,
      category: category || null,
      color: color || null,
      size: size || null,
      legacy_name: legacy_name || null,
      is_gift: Boolean(is_gift),
      is_sellable: Boolean(is_sellable),
      is_active: Boolean(is_active),
      is_component: Boolean(is_component),
      condition: condition || 'new',
    };

    if (normal_price !== undefined && normal_price !== null && normal_price !== '') {
      payload.normal_price = Number(normal_price);
    }
    if (sale_price !== undefined && sale_price !== null && sale_price !== '') {
      payload.sale_price = Number(sale_price);
    }

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select(PRODUCT_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[admin/products][POST] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '상품 생성에 실패했습니다.',
      });
    }

    return res.status(201).json({
      success: true,
      message: '상품이 생성되었습니다.',
      product: data,
    });
  } catch (error: any) {
    console.error('[admin/products][POST] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 생성 중 서버 오류가 발생했습니다.',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      name,
      sku,
      category,
      color,
      size,
      legacy_name,
      is_gift,
      is_sellable,
      is_active,
      normal_price,
      sale_price,
      is_component,
      condition,
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ success: false, message: '상품 ID가 필요합니다.' });
    }

    const update: any = {};

    if (name !== undefined) update.name = name;
    if (sku !== undefined) update.sku = sku || null;
    if (category !== undefined) update.category = category || null;
    if (color !== undefined) update.color = color || null;
    if (size !== undefined) update.size = size || null;
    if (legacy_name !== undefined) update.legacy_name = legacy_name || null;
    if (is_gift !== undefined) update.is_gift = Boolean(is_gift);
    if (is_sellable !== undefined) update.is_sellable = Boolean(is_sellable);
    if (is_active !== undefined) update.is_active = Boolean(is_active);
    if (is_component !== undefined) update.is_component = Boolean(is_component);
    if (condition !== undefined) update.condition = condition || 'new';

    if (normal_price !== undefined) {
      update.normal_price =
        normal_price === null || normal_price === '' ? null : Number(normal_price);
    }
    if (sale_price !== undefined) {
      update.sale_price =
        sale_price === null || sale_price === '' ? null : Number(sale_price);
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: '변경할 값이 없습니다.' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('id', id)
      .select(PRODUCT_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[admin/products][PUT] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '상품 수정에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '상품이 수정되었습니다.',
      product: data,
    });
  } catch (error: any) {
    console.error('[admin/products][PUT] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 수정 중 서버 오류가 발생했습니다.',
    });
  }
}

// DELETE는 실제 삭제 대신 is_active=false 로 소프트 삭제
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const idParam = req.query.id ?? (req.body && req.body.id);
    const id = typeof idParam === 'string' ? Number(idParam) : idParam;

    if (!id) {
      return res.status(400).json({ success: false, message: '상품 ID가 필요합니다.' });
    }

    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .select(PRODUCT_SELECT_COLUMNS)
      .single();

    if (error) {
      console.error('[admin/products][DELETE] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '상품 비활성화에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '상품이 비활성화되었습니다.',
      product: data,
    });
  } catch (error: any) {
    console.error('[admin/products][DELETE] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '상품 비활성화 중 서버 오류가 발생했습니다.',
    });
  }
}





